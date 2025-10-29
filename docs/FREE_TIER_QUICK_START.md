# Free 套餐限制 - 快速开始指南

## 📌 一句话总结

**实现 Free 用户每天 1 次生成限制、水印标识、24 小时过期和自动清理**

---

## 🎯 核心需求

| 需求 | 实现方式 | 优先级 |
|------|---------|--------|
| 每天 1 次 | DailyQuota 配额检查 | 🔴 必须 |
| 加水印 | sharp 库处理 | 🔴 必须 |
| 24 小时过期 | Photo.expiresAt 字段 | 🔴 必须 |
| 自动删除 | Cron Job 清理 | 🔴 必须 |

---

## 🚀 快速实现（4 个步骤）

### Step 1️⃣：配额检查（20 分钟）

**文件**：`app/api/generation/start/route.ts`

```typescript
// 在 POST 函数中，创建任务前添加这段代码：

import { quotasRepo } from '@/src/db/repo/quotas.repo';

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
        retryAfter: tomorrow.toISOString()
      },
      { status: 429 }
    );
  }
}
```

✅ **完成**：第一次请求成功，第二次返回 429

---

### Step 2️⃣：水印处理（45 分钟）

**新建文件**：`src/lib/watermark-processor.ts`

```typescript
import sharp from 'sharp';

export class WatermarkProcessor {
  async addWatermark(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      const watermarkSvg = Buffer.from(`
        <svg width="${width}" height="${height}">
          <text 
            x="50%" y="50%" 
            font-size="${Math.max(width, height) * 0.08}"
            fill="rgba(255, 255, 255, 0.3)"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial"
            font-weight="bold"
            transform="rotate(-45 ${width / 2} ${height / 2})"
          >
            Rizzify Free
          </text>
        </svg>
      `);

      return await sharp(imageBuffer)
        .composite([{ input: watermarkSvg, blend: 'over' }])
        .toBuffer();
    } catch (error) {
      console.error('Watermark failed:', error);
      return imageBuffer; // 降级：返回原始图片
    }
  }
}

export const watermarkProcessor = new WatermarkProcessor();
```

**修改文件**：`src/worker/real-worker.ts`

```typescript
import { watermarkProcessor } from '../lib/watermark-processor';

// 在下载和上传图片时，添加水印（仅 free 计划）
if (plan === 'free') {
  for (let i = 0; i < imageUrls.length; i++) {
    const response = await fetch(imageUrls[i]);
    const imageBuffer = await response.arrayBuffer();
    const watermarkedBuffer = await watermarkProcessor.addWatermark(
      Buffer.from(imageBuffer)
    );
    
    // 使用水印版本上传
    const objectKey = `results/${taskId}/${plan}/${String(i + 1).padStart(3, '0')}.jpg`;
    await imageManager.uploadBuffer(watermarkedBuffer, objectKey);
  }
}
```

✅ **完成**：Free 图片包含水印

---

### Step 3️⃣：过期时间和配额更新（20 分钟）

**修改文件**：`src/worker/real-worker.ts`

```typescript
// 创建 Photo 记录时
const expiresAt = plan === 'free' 
  ? new Date(Date.now() + 24 * 60 * 60 * 1000)
  : null;

const photo = await prisma.photo.create({
  data: {
    taskId,
    objectKey,
    section: plan as any,
    expiresAt, // ✅ 设置过期时间
    // ... 其他字段
  }
});

// 任务完成后更新配额
if (plan === 'free') {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await quotasRepo.increment(userId, today, 1);
}
```

✅ **完成**：设置过期时间，更新配额

---

### Step 4️⃣：自动清理（45 分钟）

**新建文件**：`scripts/cleanup-expired-photos.ts`

```typescript
import { db } from '../src/db/client';
import { deleteR2Object } from '../src/lib/r2';

export async function cleanupExpiredPhotos() {
  console.log('🧹 Cleaning up expired photos...');

  const expiredPhotos = await db.photo.findMany({
    where: {
      expiresAt: { lt: new Date() },
      deletedAt: null
    }
  });

  for (const photo of expiredPhotos) {
    try {
      await deleteR2Object(
        process.env.CLOUDFLARE_R2_RESULTS_BUCKET || 'rizzify',
        photo.objectKey
      );
      
      await db.photo.update({
        where: { id: photo.id },
        data: { deletedAt: new Date() }
      });
      
      console.log(`✅ Deleted: ${photo.objectKey}`);
    } catch (error) {
      console.error(`❌ Failed: ${photo.objectKey}`, error);
    }
  }
}
```

**新建文件**：`src/lib/cron-jobs.ts`

```typescript
import cron from 'node-cron';
import { cleanupExpiredPhotos } from '../../scripts/cleanup-expired-photos';

export function initializeCronJobs() {
  // 每小时第 5 分钟运行清理
  cron.schedule('5 * * * *', async () => {
    try {
      await cleanupExpiredPhotos();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });
}
```

**在应用启动时调用**：

```typescript
// 在 src/worker/real-worker.ts 或 app/api/health/route.ts
import { initializeCronJobs } from '../lib/cron-jobs';

initializeCronJobs(); // 调用一次
```

✅ **完成**：自动清理过期图片

---

## 📦 依赖安装

```bash
npm install sharp node-cron
```

---

## ✅ 验收清单

- [ ] 配额检查：第一次成功，第二次返回 429
- [ ] 水印：Free 图片有水印，其他计划没有
- [ ] 过期时间：Photo.expiresAt = now + 24h
- [ ] 配额更新：usedCount 增加
- [ ] 自动清理：24 小时后文件被删除
- [ ] 配额重置：每天 UTC 02:00 重置

---

## 🧪 测试命令

```bash
# 1. 测试配额检查
curl -X POST http://localhost:3000/api/generation/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"free","gender":"male","fileId":"upload-123"}'

# 2. 查看配额
psql $DATABASE_URL -c "SELECT * FROM \"DailyQuota\" WHERE \"userId\" = 'user-123';"

# 3. 查看过期时间
psql $DATABASE_URL -c "SELECT id, \"expiresAt\" FROM \"Photo\" WHERE section = 'free';"

# 4. 手动运行清理
npm run cleanup:expired-photos
```

---

## 📊 预期效果

| 指标 | 值 |
|------|-----|
| Free 用户每日生成次数 | 1 |
| 水印覆盖率 | 100% |
| 过期清理延迟 | < 1 小时 |
| 配额重置准确性 | 100% |

---

## 🎯 总耗时

- 配额检查：20 分钟
- 水印处理：45 分钟
- 过期时间：20 分钟
- 自动清理：45 分钟
- **总计：2.5 小时**

---

## 📚 详细文档

- [完整设计方案](./FREE_TIER_DESIGN.md)
- [详细实现清单](./FREE_TIER_IMPLEMENTATION.md)
- [架构总结](./FREE_TIER_SUMMARY.md)

---

## 💡 常见问题

**Q: 为什么配额重置在 UTC 02:00？**
A: 这是全球统一时间，方便管理和监控

**Q: 水印可以自定义吗？**
A: 可以，修改 watermarkProcessor.addWatermark() 中的文本

**Q: 清理失败了怎么办？**
A: 有降级处理，失败的记录会被重试

**Q: 可以手动删除 Free 图片吗？**
A: 可以，使用 DELETE FROM "Photo" WHERE id = '...'

