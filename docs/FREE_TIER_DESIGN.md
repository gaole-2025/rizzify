# Free 套餐限制方案设计

## 📋 需求概述

| 需求 | 说明 |
|------|------|
| **每日限制** | 每个用户每天只能生成 1 次（2 张图片） |
| **水印** | 所有 Free 生成的图片都要加水印 |
| **过期时间** | 24 小时后自动过期 |
| **自动删除** | 过期图片自动从 R2 删除 |

---

## 🏗️ 架构设计

### 1. 数据库层面

#### 现有结构分析
```prisma
model DailyQuota {
  userId    String
  dayUtc    DateTime @db.Date
  usedCount Int      @default(0)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, dayUtc])
}

model Photo {
  id           String    @id @default(uuid())
  taskId       String
  section      Section   // ✅ 已有 "free" section
  objectKey    String
  expiresAt    DateTime? // ✅ 已有过期时间字段
  deletedAt    DateTime? // ✅ 已有软删除字段
  // ...
}
```

**结论**：✅ 数据库结构已支持，无需迁移

---

### 2. 业务流程

```
┌─────────────────────────────────────────────────────────────┐
│ 用户提交生成请求 (plan=free)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 检查每日配额 (DailyQuota)                                    │
│ - 获取当天 UTC 日期                                          │
│ - 查询 DailyQuota(userId, dayUtc)                           │
│ - 检查 usedCount < 1                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    ✅ 通过         ❌ 超限
         │               │
         │               └─► 返回 429 Too Many Requests
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ 创建任务 (Task)                                              │
│ - plan = "free"                                             │
│ - 入队处理                                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Worker 处理任务                                              │
│ 1. 美颜处理                                                  │
│ 2. 生成 2 张图片                                             │
│ 3. 添加水印                                                  │
│ 4. 上传到 R2                                                 │
│ 5. 创建 Photo 记录 (section="free", expiresAt=now+24h)     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 更新配额                                                     │
│ - DailyQuota.usedCount += 1                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 定时清理任务 (Cron Job)                                      │
│ - 每小时运行一次                                             │
│ - 查询 expiresAt < now 的 Photo                             │
│ - 从 R2 删除文件                                             │
│ - 标记 deletedAt，软删除                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 实现方案

### 方案 1️⃣：配额检查（API 层）

**文件**：`app/api/generation/start/route.ts`

```typescript
// 在创建任务前添加配额检查
async function checkDailyQuota(userId: string, plan: string) {
  if (plan !== 'free') return true; // 只检查 free 计划

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const quota = await quotasRepo.getForDay(userId, today);
  
  if (quota && quota.usedCount >= 1) {
    return false; // 已超限
  }
  
  return true; // 未超限
}

// 在 POST 处理中
if (plan === 'free') {
  const canGenerate = await checkDailyQuota(user.id, plan);
  if (!canGenerate) {
    return NextResponse.json(
      { 
        error: 'Daily limit reached. Free users can generate once per day.',
        retryAfter: getNextResetTime() // 返回下次重置时间
      },
      { status: 429 }
    );
  }
}
```

---

### 方案 2️⃣：水印处理（Worker 层）

**文件**：`src/lib/watermark-processor.ts` (新建)

```typescript
import sharp from 'sharp';

export class WatermarkProcessor {
  /**
   * 为图片添加水印
   */
  async addWatermark(
    imageBuffer: Buffer,
    watermarkText: string = 'Rizzify Free'
  ): Promise<Buffer> {
    const width = 1024;
    const height = 1024;

    // 创建水印文本 SVG
    const watermarkSvg = Buffer.from(`
      <svg width="${width}" height="${height}">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text 
          x="50%" 
          y="50%" 
          font-size="48" 
          fill="rgba(255, 255, 255, 0.3)"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial"
          filter="url(#shadow)"
          transform="rotate(-45)"
        >
          ${watermarkText}
        </text>
      </svg>
    `);

    // 使用 sharp 合成水印
    return await sharp(imageBuffer)
      .composite([
        {
          input: watermarkSvg,
          blend: 'over'
        }
      ])
      .toBuffer();
  }
}

export const watermarkProcessor = new WatermarkProcessor();
```

**在 Worker 中使用**：`src/worker/real-worker.ts`

```typescript
// 在生成图片后添加水印（仅 free 计划）
if (plan === 'free') {
  console.log('[RealWorker] Adding watermark to free tier images...');
  
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const imageBuffer = await downloadImage(imageUrl);
    const watermarkedBuffer = await watermarkProcessor.addWatermark(imageBuffer);
    
    // 上传水印版本
    const objectKey = `results/${taskId}/${plan}/${String(i + 1).padStart(3, '0')}.jpg`;
    await imageManager.uploadBuffer(watermarkedBuffer, objectKey);
  }
}
```

---

### 方案 3️⃣：过期时间设置（Worker 层）

**文件**：`src/worker/real-worker.ts`

```typescript
// 创建 Photo 记录时设置过期时间
const expiresAt = plan === 'free' 
  ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 小时后
  : null; // 其他计划不过期

const photo = await prisma.photo.create({
  data: {
    taskId,
    objectKey,
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

---

### 方案 4️⃣：配额更新（Worker 层）

**文件**：`src/worker/real-worker.ts`

```typescript
// 任务完成后更新配额
if (plan === 'free') {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  await quotasRepo.increment(userId, today, 1);
  console.log(`[RealWorker] Updated daily quota for user ${userId}`);
}
```

---

### 方案 5️⃣：自动清理任务（Cron Job）

**文件**：`scripts/cleanup-expired-photos.ts` (新建)

```typescript
import { db } from '../src/db/client';
import { deleteR2Object } from '../src/lib/r2';

/**
 * 清理过期的 Free 图片
 * 应该每小时运行一次
 */
async function cleanupExpiredPhotos() {
  console.log('🧹 Starting cleanup of expired photos...');

  try {
    // 查询所有过期但未删除的 Photo
    const expiredPhotos = await db.photo.findMany({
      where: {
        expiresAt: {
          lt: new Date() // 过期时间 < 现在
        },
        deletedAt: null // 未被软删除
      },
      select: {
        id: true,
        objectKey: true,
        section: true
      }
    });

    console.log(`📊 Found ${expiredPhotos.length} expired photos to clean up`);

    let successCount = 0;
    let failureCount = 0;

    // 逐个删除
    for (const photo of expiredPhotos) {
      try {
        // 从 R2 删除文件
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

    console.log(`📊 Cleanup completed: ${successCount} deleted, ${failureCount} failed`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// 导出供 cron 调用
export { cleanupExpiredPhotos };
```

**Cron 配置**（使用 pg-boss 或 node-cron）：

```typescript
// 在应用启动时注册 cron job
import cron from 'node-cron';
import { cleanupExpiredPhotos } from '../scripts/cleanup-expired-photos';

// 每小时的第 5 分钟运行
cron.schedule('5 * * * *', async () => {
  console.log('⏰ Running scheduled cleanup...');
  try {
    await cleanupExpiredPhotos();
  } catch (error) {
    console.error('Scheduled cleanup failed:', error);
  }
});
```

---

### 方案 6️⃣：配额重置（Cron Job）

**文件**：`scripts/quotas-rollover.ts` (已存在，增强)

```typescript
// 现有脚本已支持每日重置
// 配置在 UTC 02:00 运行即可

// Cron 配置
cron.schedule('0 2 * * *', async () => {
  console.log('⏰ Running daily quota rollover...');
  try {
    await quotasRollover();
  } catch (error) {
    console.error('Quota rollover failed:', error);
  }
});
```

---

## 📝 API 响应示例

### 成功生成
```json
{
  "taskId": "task-123",
  "status": "queued",
  "plan": "free",
  "message": "Task queued successfully"
}
```

### 超过每日限制
```json
{
  "error": "Daily limit reached. Free users can generate once per day.",
  "retryAfter": "2025-10-23T02:00:00Z",
  "status": 429
}
```

---

## 🗂️ 文件修改清单

| 文件 | 操作 | 优先级 |
|------|------|--------|
| `app/api/generation/start/route.ts` | 添加配额检查 | 🔴 必须 |
| `src/lib/watermark-processor.ts` | 新建水印处理器 | 🔴 必须 |
| `src/worker/real-worker.ts` | 集成水印 + 过期时间 + 配额更新 | 🔴 必须 |
| `scripts/cleanup-expired-photos.ts` | 新建清理脚本 | 🔴 必须 |
| `src/lib/cron-jobs.ts` | 新建 Cron 配置 | 🔴 必须 |
| `src/lib/r2.ts` | 添加 deleteR2Object 函数 | 🟡 可能需要 |

---

## 🔄 完整流程时间线

```
Day 1 - 10:00 UTC
├─ 用户提交 free 计划生成请求
├─ ✅ 配额检查通过 (usedCount=0)
├─ 任务入队
└─ 返回 taskId

Day 1 - 10:05 UTC
├─ Worker 处理任务
├─ 生成 2 张图片
├─ 添加水印
├─ 上传到 R2
├─ 创建 Photo 记录 (expiresAt = Day 2 10:05 UTC)
└─ 更新 DailyQuota (usedCount=1)

Day 1 - 10:10 UTC
├─ 用户尝试再次生成
├─ ❌ 配额检查失败 (usedCount=1)
└─ 返回 429 Too Many Requests

Day 2 - 02:00 UTC
├─ Cron: quotas-rollover 运行
├─ 为所有用户初始化新的 DailyQuota
└─ Day 1 的 usedCount 被保留（历史记录）

Day 2 - 10:05 UTC
├─ Cron: cleanup-expired-photos 运行
├─ 查询 expiresAt < now 的 Photo
├─ 从 R2 删除文件
└─ 标记 deletedAt

Day 2 - 10:10 UTC
├─ 用户可以再次生成 (新的 DailyQuota)
└─ ✅ 配额检查通过 (usedCount=0)
```

---

## 🧪 测试场景

### 测试 1：每日限制
```bash
# 第一次请求 - 应该成功
curl -X POST /api/generation/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"free","gender":"male","fileId":"upload-123"}'
# 预期：200 OK, taskId

# 第二次请求（同一天）- 应该失败
curl -X POST /api/generation/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"free","gender":"female","fileId":"upload-456"}'
# 预期：429 Too Many Requests
```

### 测试 2：水印验证
```bash
# 下载 free 图片，验证水印存在
curl -X GET /api/user/results?plan=free
# 验证返回的图片包含 "Rizzify Free" 水印
```

### 测试 3：过期清理
```bash
# 手动运行清理脚本
npm run cleanup:expired-photos

# 验证 24 小时前的 free 图片已被删除
# 验证 Photo.deletedAt 已设置
# 验证 R2 中文件已删除
```

---

## 📊 监控指标

### 关键指标
- **每日生成数**：Free 用户每天生成次数
- **配额超限率**：用户超过每日限制的比例
- **清理成功率**：过期图片清理成功率
- **水印覆盖率**：Free 图片中包含水印的比例

### 告警规则
- 🟡 清理失败率 > 5%：检查 R2 连接
- 🔴 配额检查异常：检查数据库连接

---

## 💡 未来优化

1. **灵活配额**：支持不同用户不同的每日限制
2. **配额购买**：允许用户购买额外配额
3. **水印定制**：支持自定义水印文本
4. **批量清理**：优化清理性能（批量删除）
5. **分析仪表板**：展示 Free 用户的使用统计

