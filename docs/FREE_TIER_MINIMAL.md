# Free 套餐限制 - 精简版（仅 2 个功能）

## 🎯 需求

| 功能 | 实现方式 | 优先级 |
|------|---------|--------|
| **每天 1 次** | DailyQuota 配额检查 | 🔴 必须 |
| **加水印** | sharp 库处理 | 🔴 必须 |

---

## 🚀 实现（总耗时：1 小时）

### Step 1️⃣：配额检查（20 分钟）

**文件**：`app/api/generation/start/route.ts`

在 POST 函数中，创建任务前添加：

```typescript
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
        retryAfter: tomorrow.toISOString()
      },
      { status: 429 }
    );
  }
}

// 继续创建任务...
```

**完成**：✅ 第一次请求成功，第二次返回 429

---

### Step 2️⃣：水印处理（40 分钟）

#### 2.1 新建水印处理器

**新建文件**：`src/lib/watermark-processor.ts`

```typescript
import sharp from 'sharp';

export class WatermarkProcessor {
  async addWatermark(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      // 创建水印 SVG
      const watermarkSvg = Buffer.from(`
        <svg width="${width}" height="${height}">
          <text 
            x="50%" 
            y="50%" 
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

      // 合成水印
      return await sharp(imageBuffer)
        .composite([{ input: watermarkSvg, blend: 'over' }])
        .toBuffer();
    } catch (error) {
      console.error('Failed to add watermark:', error);
      return imageBuffer; // 降级：返回原始图片
    }
  }
}

export const watermarkProcessor = new WatermarkProcessor();
```

#### 2.2 在 Worker 中集成水印

**文件**：`src/worker/real-worker.ts`

在下载和上传图片的部分，修改为：

```typescript
import { watermarkProcessor } from '../lib/watermark-processor';

// 在处理图片时，添加水印（仅 free 计划）
if (plan === 'free') {
  console.log('[RealWorker] Adding watermark to free tier images...');
  
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      // 下载原始图片
      const response = await fetch(imageUrls[i]);
      const imageBuffer = await response.arrayBuffer();
      
      // 添加水印
      const watermarkedBuffer = await watermarkProcessor.addWatermark(
        Buffer.from(imageBuffer)
      );
      
      // 上传水印版本
      const objectKey = `results/${taskId}/${plan}/${String(i + 1).padStart(3, '0')}.jpg`;
      await imageManager.uploadBuffer(watermarkedBuffer, objectKey);
      
      console.log(`[RealWorker] ✅ Image ${i + 1} with watermark uploaded`);
    } catch (error) {
      console.error(`[RealWorker] ❌ Failed to watermark image ${i + 1}:`, error);
      // 降级：上传原始图片
      const objectKey = `results/${taskId}/${plan}/${String(i + 1).padStart(3, '0')}.jpg`;
      await imageManager.uploadBuffer(Buffer.from(await fetch(imageUrls[i]).then(r => r.arrayBuffer())), objectKey);
    }
  }
} else {
  // Start/Pro 计划：直接上传，无水印
  for (let i = 0; i < imageUrls.length; i++) {
    const response = await fetch(imageUrls[i]);
    const imageBuffer = await response.arrayBuffer();
    const objectKey = `results/${taskId}/${plan}/${String(i + 1).padStart(3, '0')}.jpg`;
    await imageManager.uploadBuffer(Buffer.from(imageBuffer), objectKey);
  }
}
```

#### 2.3 更新配额

**文件**：`src/worker/real-worker.ts`

在任务完成后添加：

```typescript
// 任务完成，更新配额（仅 free 计划）
if (plan === 'free') {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  await quotasRepo.increment(userId, today, 1);
  console.log(`[RealWorker] ✅ Updated daily quota for user ${userId}`);
}
```

---

## 📦 依赖安装

```bash
npm install sharp
```

检查 package.json 中是否已有 sharp：

```bash
npm list sharp
```

如果没有，安装：

```bash
npm install sharp
```

---

## ✅ 验收标准

### 配额检查
- [ ] 第一次请求成功（返回 taskId）
- [ ] 第二次请求返回 429
- [ ] 返回 retryAfter 时间
- [ ] 下一天可以再次请求

### 水印
- [ ] Free 图片包含水印
- [ ] Start/Pro 图片不包含水印
- [ ] 水印文本为 "Rizzify Free"
- [ ] 水印位置在中间，45 度旋转
- [ ] 水印不影响图片质量

---

## 🧪 测试命令

### 测试 1：配额检查

```bash
# 第一次请求（应该成功）
curl -X POST http://localhost:3000/api/generation/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plan": "free",
    "gender": "male",
    "fileId": "upload-123"
  }'

# 预期响应：
# {
#   "taskId": "task-xxx",
#   "status": "queued",
#   "message": "Task queued successfully"
# }

# 第二次请求（应该返回 429）
curl -X POST http://localhost:3000/api/generation/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plan": "free",
    "gender": "female",
    "fileId": "upload-456"
  }'

# 预期响应：
# {
#   "error": "Daily limit reached. Free users can generate once per day.",
#   "retryAfter": "2025-10-24T00:00:00Z",
#   "statusCode": 429
# }
```

### 测试 2：查看配额

```bash
# 查看数据库中的配额
psql $DATABASE_URL -c "SELECT * FROM \"DailyQuota\" WHERE \"userId\" = 'user-123';"

# 预期结果：
# userId | dayUtc | usedCount
# -------|--------|----------
# user-123 | 2025-10-23 | 1
```

### 测试 3：验证水印

```bash
# 下载 free 计划的图片，用图片查看器打开
# 验证图片中间有 "Rizzify Free" 水印（45 度旋转）
```

---

## 📊 预期效果

| 指标 | 值 |
|------|-----|
| Free 用户每日生成次数 | 1 |
| 水印覆盖率 | 100% |
| 配额检查延迟 | < 100ms |
| 水印处理延迟 | < 2s |

---

## 🎯 总耗时

- 配额检查：20 分钟
- 水印处理：40 分钟
- **总计：1 小时**

---

## 📝 代码量

- 配额检查：~15 行
- 水印处理器：~40 行
- Worker 集成：~30 行
- **总计：~85 行**

---

## 💡 注意事项

1. **降级处理**：水印失败时自动使用原始图片，不会中断流程
2. **仅 Free 计划**：Start/Pro 计划不添加水印，不更新配额
3. **性能**：水印处理延迟 < 2 秒，不会显著影响总耗时
4. **配额重置**：现有的 `quotas-rollover.ts` 脚本每天 UTC 02:00 自动重置

---

## 🚀 立即开始

1. 安装 sharp：`npm install sharp`
2. 创建 `src/lib/watermark-processor.ts`
3. 修改 `app/api/generation/start/route.ts`
4. 修改 `src/worker/real-worker.ts`
5. 测试验证

完成！✅

