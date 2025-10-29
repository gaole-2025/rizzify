# Free 套餐限制 - 快速实现清单

## 🚀 实现步骤（按优先级）

### Phase 1️⃣：配额检查（1-2 小时）

#### Step 1.1：修改 API 端点
**文件**：`app/api/generation/start/route.ts`

```typescript
// 在 POST 函数中，创建任务前添加：

import { quotasRepo } from '@/src/db/repo/quotas.repo';

// 检查 Free 计划的每日配额
if (plan === 'free') {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const quota = await quotasRepo.getForDay(user.id, today);
  
  if (quota && quota.usedCount >= 1) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return NextResponse.json(
      {
        error: 'Daily limit reached. Free users can generate once per day.',
        retryAfter: tomorrow.toISOString(),
        statusCode: 429
      },
      { status: 429 }
    );
  }
}
```

**测试**：
```bash
# 第一次请求应该成功
# 第二次请求应该返回 429
```

---

### Phase 2️⃣：水印处理（2-3 小时）

#### Step 2.1：创建水印处理器
**文件**：`src/lib/watermark-processor.ts` (新建)

```typescript
import sharp from 'sharp';

export class WatermarkProcessor {
  async addWatermark(
    imageBuffer: Buffer,
    watermarkText: string = 'Rizzify Free'
  ): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      // 创建水印 SVG
      const watermarkSvg = Buffer.from(`
        <svg width="${width}" height="${height}">
          <defs>
            <filter id="shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
            </filter>
          </defs>
          <text 
            x="50%" 
            y="50%" 
            font-size="${Math.max(width, height) * 0.08}" 
            fill="rgba(255, 255, 255, 0.3)"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, sans-serif"
            font-weight="bold"
            filter="url(#shadow)"
            transform="rotate(-45 ${width / 2} ${height / 2})"
          >
            ${watermarkText}
          </text>
        </svg>
      `);

      return await sharp(imageBuffer)
        .composite([{ input: watermarkSvg, blend: 'over' }])
        .toBuffer();
    } catch (error) {
      console.error('Failed to add watermark:', error);
      // 如果水印失败，返回原始图片
      return imageBuffer;
    }
  }
}

export const watermarkProcessor = new WatermarkProcessor();
```

**依赖检查**：
```bash
npm list sharp
# 如果没有安装，运行：
npm install sharp
```

#### Step 2.2：在 Worker 中集成水印
**文件**：`src/worker/real-worker.ts`

在下载和上传图片的部分，添加：

```typescript
import { watermarkProcessor } from '../lib/watermark-processor';

// 在 downloadAndUpload 之前添加水印（仅 free 计划）
if (plan === 'free') {
  console.log('[RealWorker] Adding watermark to free tier images...');
  
  const watermarkedUrls: string[] = [];
  
  for (const imageUrl of imageUrls) {
    try {
      // 下载原始图片
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      
      // 添加水印
      const watermarkedBuffer = await watermarkProcessor.addWatermark(
        Buffer.from(imageBuffer)
      );
      
      // 生成临时 URL（用于后续上传）
      const tempUrl = URL.createObjectURL(
        new Blob([watermarkedBuffer], { type: 'image/jpeg' })
      );
      watermarkedUrls.push(tempUrl);
    } catch (error) {
      console.error(`Failed to watermark image: ${imageUrl}`, error);
      watermarkedUrls.push(imageUrl); // 降级：使用原始图片
    }
  }
  
  // 使用水印版本的 URL
  imageUrls = watermarkedUrls;
}
```

**测试**：
```bash
# 生成 free 计划的图片，验证水印存在
```

---

### Phase 3️⃣：过期时间和配额更新（1 小时）

#### Step 3.1：设置过期时间
**文件**：`src/worker/real-worker.ts`

在创建 Photo 记录时：

```typescript
// 计算过期时间
const expiresAt = plan === 'free' 
  ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 小时后
  : null;

// 创建 Photo 记录
const photo = await prisma.photo.create({
  data: {
    taskId,
    objectKey: uploadedKey,
    section: plan as any,
    originalName: `${plan}_${photoIndex}.jpg`,
    width: 1024,
    height: 1024,
    mime: 'image/jpeg',
    sizeBytes: 0,
    expiresAt, // ✅ 设置过期时间
  }
});
```

#### Step 3.2：更新配额
**文件**：`src/worker/real-worker.ts`

在任务完成后：

```typescript
// 任务完成，更新配额
if (plan === 'free') {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  await quotasRepo.increment(userId, today, 1);
  console.log(`[RealWorker] Updated daily quota for user ${userId}`);
}
```

**测试**：
```bash
# 验证 Photo.expiresAt 已设置为 24 小时后
# 验证 DailyQuota.usedCount 已增加
```

---

### Phase 4️⃣：自动清理（2-3 小时）

#### Step 4.1：创建清理脚本
**文件**：`scripts/cleanup-expired-photos.ts` (新建)

```typescript
import { db } from '../src/db/client';
import { deleteR2Object } from '../src/lib/r2';

export async function cleanupExpiredPhotos() {
  console.log('🧹 Starting cleanup of expired photos...');

  try {
    // 查询过期的 Photo
    const expiredPhotos = await db.photo.findMany({
      where: {
        expiresAt: { lt: new Date() },
        deletedAt: null
      }
    });

    console.log(`📊 Found ${expiredPhotos.length} expired photos`);

    let successCount = 0;
    let failureCount = 0;

    for (const photo of expiredPhotos) {
      try {
        // 从 R2 删除
        await deleteR2Object(
          process.env.CLOUDFLARE_R2_RESULTS_BUCKET || 'rizzify',
          photo.objectKey
        );

        // 标记为已删除
        await db.photo.update({
          where: { id: photo.id },
          data: { deletedAt: new Date() }
        });

        successCount++;
        console.log(`✅ Deleted: ${photo.objectKey}`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to delete ${photo.objectKey}:`, error);
      }
    }

    console.log(`✅ Cleanup completed: ${successCount} deleted, ${failureCount} failed`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupExpiredPhotos().catch(console.error);
}
```

#### Step 4.2：检查 R2 删除函数
**文件**：`src/lib/r2.ts`

确保存在 `deleteR2Object` 函数：

```typescript
export async function deleteR2Object(bucket: string, key: string): Promise<void> {
  const s3Client = new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  });

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
```

#### Step 4.3：创建 Cron 配置
**文件**：`src/lib/cron-jobs.ts` (新建)

```typescript
import cron from 'node-cron';
import { cleanupExpiredPhotos } from '../../scripts/cleanup-expired-photos';
import { quotasRollover } from '../../scripts/quotas-rollover';

export function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  // 每小时的第 5 分钟运行清理
  cron.schedule('5 * * * *', async () => {
    console.log('⏰ Running scheduled cleanup...');
    try {
      await cleanupExpiredPhotos();
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  });

  // 每天 UTC 02:00 运行配额重置
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running daily quota rollover...');
    try {
      await quotasRollover();
    } catch (error) {
      console.error('Quota rollover failed:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
}
```

#### Step 4.4：在应用启动时初始化 Cron
**文件**：`src/worker/real-worker.ts` 或 `app/api/health/route.ts`

```typescript
import { initializeCronJobs } from '../lib/cron-jobs';

// 在应用启动时调用一次
initializeCronJobs();
```

**测试**：
```bash
# 手动运行清理脚本
npm run cleanup:expired-photos

# 验证过期图片已被删除
# 验证 Photo.deletedAt 已设置
```

---

## 📦 依赖安装

```bash
# 如果还没有安装这些包
npm install sharp node-cron
```

**package.json 脚本**：
```json
{
  "scripts": {
    "cleanup:expired-photos": "ts-node scripts/cleanup-expired-photos.ts",
    "quotas:rollover": "ts-node scripts/quotas-rollover.ts"
  }
}
```

---

## ✅ 验收标准

### 配额检查
- [ ] 第一次请求成功
- [ ] 第二次请求返回 429
- [ ] 下一天可以再次请求
- [ ] 返回 retryAfter 时间

### 水印
- [ ] Free 图片包含水印
- [ ] Start/Pro 图片不包含水印
- [ ] 水印不影响图片质量

### 过期清理
- [ ] Photo.expiresAt 设置正确
- [ ] 24 小时后自动清理
- [ ] R2 文件已删除
- [ ] Photo.deletedAt 已设置

### 配额更新
- [ ] 任务完成后 usedCount 增加
- [ ] 每天 UTC 02:00 重置
- [ ] 历史数据保留

---

## 🧪 测试命令

```bash
# 1. 测试配额检查
curl -X POST http://localhost:3000/api/generation/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plan": "free",
    "gender": "male",
    "fileId": "upload-123"
  }'

# 2. 查看 DailyQuota
psql $DATABASE_URL -c "SELECT * FROM \"DailyQuota\" WHERE \"userId\" = 'user-123';"

# 3. 查看 Photo 过期时间
psql $DATABASE_URL -c "SELECT id, \"expiresAt\", \"deletedAt\" FROM \"Photo\" WHERE section = 'free';"

# 4. 手动运行清理
npm run cleanup:expired-photos

# 5. 查看日志
tail -f logs/worker.log
```

---

## 📊 预期效果

| 指标 | 预期值 |
|------|--------|
| Free 用户每日生成次数 | 1 次 |
| 水印覆盖率 | 100% |
| 过期清理延迟 | < 1 小时 |
| 配额重置准确性 | 100% |

---

## 🚀 部署检查

- [ ] 所有代码已提交
- [ ] 依赖已安装
- [ ] 环境变量已配置
- [ ] Cron 任务已启用
- [ ] 监控告警已配置
- [ ] 测试通过

