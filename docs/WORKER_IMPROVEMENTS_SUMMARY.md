# Worker 改进总结

## 🎯 目标

修复 RealWorker 的调用逻辑，并为每一步添加详细的日志，以便于调试和追踪任务处理流程。

## ✅ 已完成的改进

### 1. 修复 uploadId 传递问题

**问题**：`uploadId` 在任务入队时没有被传递，导致 RealWorker 无法查询 Upload 记录。

**修复**：
- ✅ 更新 `src/lib/queue.ts` - 添加 `uploadId` 到 `TaskGenerationJob` 接口
- ✅ 更新 `app/api/generation/start/route.ts` - 在 `enqueueTaskGeneration()` 中传递 `uploadId: upload.id`

**文件变更**：
```typescript
// src/lib/queue.ts
export interface TaskGenerationJob {
  taskId: string
  userId: string
  uploadId: string  // ✅ 新增
  plan: 'free' | 'start' | 'pro'
  gender: 'male' | 'female'
  style: string
  fileKey: string
  idempotencyKey: string
}

// app/api/generation/start/route.ts
await enqueueTaskGeneration({
  taskId: task.id,
  userId: upload.userId,
  uploadId: upload.id,  // ✅ 新增
  plan: plan as any,
  gender: gender as any,
  style: 'classic',
  fileKey: upload.objectKey,
  idempotencyKey: finalIdempotencyKey
});
```

### 2. 配置 API 超时和重试策略

**改进**：
- ✅ 超时时间：15s → 120s
- ✅ 重试间隔：指数退避 → 固定 10s
- ✅ 重试次数：保持 3 次

**文件变更**：
```typescript
// .env
APIORE_TIMEOUT_MS=120000  # 从 15000 改为 120000

// src/lib/apicore-client.ts
const delay = 10000; // Fixed 10s interval between retries
const timeoutMs = parseInt(process.env.APIORE_TIMEOUT_MS || '120000', 10);
```

### 3. 为 RealWorker 添加详细日志

**日志覆盖**：
- ✅ JOB RECEIVED - 接收任务
- ✅ JOB PARSED - 解析任务数据（显示所有参数）
- ✅ STEP 1-7 - 每个处理步骤都有清晰的日志
- ✅ 错误处理 - 详细的错误堆栈和消息

**日志示例**：
```
================================================================================
[RealWorker] ========== JOB RECEIVED ==========
[RealWorker] Received job: [...]
[RealWorker] ========== JOB PARSED ==========
[RealWorker] taskId: 695170b3-da7d-4ee3-ba96-192f3da38ed6
[RealWorker] userId: 7b35c986-ce3e-429c-9d71-1ac8557e0634
[RealWorker] uploadId: c5aa0f76-addf-4e40-9bcf-51fd1e9d2ebf
[RealWorker] plan: free
[RealWorker] gender: male
[RealWorker] style: classic

[RealWorker] ========== STEP 1: UPDATE STATUS TO RUNNING ==========
[RealWorker] ✅ Task status updated to running

[RealWorker] ========== STEP 2: FETCH UPLOAD ==========
[RealWorker] Fetching upload with ID: c5aa0f76-addf-4e40-9bcf-51fd1e9d2ebf
[RealWorker] ✅ Found upload: image_1761049716000_nwhgco.jpg
[RealWorker]    - objectKey: uploads/1761049716000-c5aa0f76-addf-4e40-9bcf-51fd1e9d2ebf-image_1761049716000_nwhgco.jpg
[RealWorker]    - size: 245678 bytes
[RealWorker]    - dimensions: 1024x1024
[RealWorker]    - URL: https://rizzify.org/uploads/...
...
```

### 4. 为 BeautifyProcessor 添加详细日志

**日志覆盖**：
- ✅ BEAUTIFY PROCESS START - 开始处理
- ✅ Step 1: Calling Apicore API - API 调用
- ✅ Step 2: Downloading and uploading to R2 - 下载和上传
- ✅ Step 3: Getting image metadata - 获取元数据
- ✅ BEAUTIFY PROCESS COMPLETED - 完成

### 5. 为 ApicoreClient 添加详细日志

**日志覆盖**：
- ✅ GENERATE START - 开始生成
- ✅ Processing request N/M - 处理每个请求
- ✅ Attempt N/M - 重试尝试
- ✅ API call details - API 调用细节（URL、超时、响应时间）
- ✅ GENERATE COMPLETED - 完成

**性能指标**：
- API 响应时间
- 重试次数和间隔
- 超时配置

### 6. 为 ImageManager 添加详细日志

**日志覆盖**：
- ✅ DOWNLOAD AND UPLOAD START - 开始处理
- ✅ Downloading image from URL - 下载详情（URL、文件大小、耗时）
- ✅ Uploading to R2 - 上传详情（Bucket、Object Key、耗时）
- ✅ Cleanup - 清理临时文件
- ✅ DOWNLOAD AND UPLOAD COMPLETED - 完成

**性能指标**：
- 下载时间和大小
- 上传时间
- 总处理时间

## 📊 日志输出结构

```
================================================================================
[RealWorker] ========== JOB RECEIVED ==========
  ↓
[RealWorker] ========== JOB PARSED ==========
  ↓
[RealWorker] ========== STEP 1: UPDATE STATUS TO RUNNING ==========
  ↓
[RealWorker] ========== STEP 2: FETCH UPLOAD ==========
  ↓
[RealWorker] ========== STEP 3: CREATE UPLOADED PHOTO RECORD ==========
  ↓
[RealWorker] ========== STEP 4: BEAUTIFY PROCESSING ==========
  ├─ [BeautifyProcessor] ========== BEAUTIFY PROCESS START ==========
  ├─ [BeautifyProcessor] Step 1: Calling Apicore API for beautification
  │  ├─ [ApicoreClient] ========== GENERATE START ==========
  │  ├─ [ApicoreClient] Processing request 1/1
  │  ├─ [ApicoreClient] Attempt 1/3...
  │  ├─ [ApicoreClient]     Calling API: https://api.apicore.ai/...
  │  ├─ [ApicoreClient]     Response received in 8234ms (status: 200)
  │  └─ [ApicoreClient] ========== GENERATE COMPLETED ==========
  ├─ [BeautifyProcessor] Step 2: Downloading and uploading to R2
  │  ├─ [ImageManager] ========== DOWNLOAD AND UPLOAD START ==========
  │  ├─ [ImageManager] Downloading image from URL...
  │  ├─ [ImageManager] ✅ Downloaded 45678 bytes in 1234ms
  │  ├─ [ImageManager] Uploading to R2...
  │  ├─ [ImageManager] ✅ Uploaded in 567ms
  │  └─ [ImageManager] ========== DOWNLOAD AND UPLOAD COMPLETED ==========
  └─ [BeautifyProcessor] ========== BEAUTIFY PROCESS COMPLETED ==========
  ↓
[RealWorker] ========== STEP 5: SAMPLE PROMPTS ==========
  ↓
[RealWorker] ========== STEP 6: GENERATE STYLED PHOTOS ==========
  ├─ BATCH 1/1
  ├─ [ApicoreClient] ========== GENERATE START ==========
  ├─ [ApicoreClient] Processing request 1/2
  ├─ [ApicoreClient] ✅ Request 1 completed
  ├─ [ApicoreClient] Processing request 2/2
  ├─ [ApicoreClient] ✅ Request 2 completed
  ├─ [ApicoreClient] ========== GENERATE COMPLETED ==========
  ├─ Image 1/2: Downloading and uploading...
  ├─ [ImageManager] ========== DOWNLOAD AND UPLOAD START ==========
  ├─ [ImageManager] ✅ Downloaded ... bytes in ...ms
  ├─ [ImageManager] ✅ Uploaded in ...ms
  ├─ [ImageManager] ========== DOWNLOAD AND UPLOAD COMPLETED ==========
  └─ Progress: 1/2 (60%)
  ↓
[RealWorker] ========== STEP 7: FINALIZE TASK ==========
  ↓
[RealWorker] ✅ Generation completed for task: 695170b3-da7d-4ee3-ba96-192f3da38ed6
[RealWorker] Total photos created: 4
[RealWorker]   - Uploaded: 1
[RealWorker]   - Beautified: 1
[RealWorker]   - Generated: 2
[RealWorker] Processing time: 45.234s
================================================================================
```

## 🔍 调试命令

### 查看完整流程
```bash
npm run dev 2>&1 | grep -E "\[RealWorker\]|\[BeautifyProcessor\]|\[ApicoreClient\]|\[ImageManager\]"
```

### 查看仅 RealWorker 日志
```bash
npm run dev 2>&1 | grep "\[RealWorker\]"
```

### 查看仅 API 调用日志
```bash
npm run dev 2>&1 | grep "\[ApicoreClient\]"
```

### 查看仅错误
```bash
npm run dev 2>&1 | grep "❌"
```

### 查看性能指标
```bash
npm run dev 2>&1 | grep -E "ms|seconds"
```

## 📈 性能预估

基于当前配置：

| 步骤 | 时间 | 说明 |
|------|------|------|
| 更新状态 | ~100ms | 数据库操作 |
| 获取 Upload | ~50ms | 数据库查询 |
| 创建 Photo 记录 | ~100ms | 数据库插入 |
| 美颜处理 | ~10-15s | API 调用 + 下载/上传 |
| 采样提示词 | ~50ms | 内存操作 |
| 生成 2 张图片 | ~20-30s | 2 × API 调用 + 下载/上传 |
| **总计 (Free)** | **~30-45s** | 1 uploaded + 1 beautified + 2 generated |
| **总计 (Start)** | **~3-5 分钟** | 1 uploaded + 1 beautified + 30 generated |
| **总计 (Pro)** | **~7-10 分钟** | 1 uploaded + 1 beautified + 70 generated |

## 🚀 现在可以测试

```bash
npm run dev
```

然后上传图片并选择 Free 计划，观察完整的日志输出。

## 📝 文档

- `docs/WORKER_LOGGING_GUIDE.md` - 详细的日志指南
- `docs/BUG_FIX_UPLOADID.md` - uploadId 修复说明
- `docs/API_TIMEOUT_CONFIG.md` - API 超时配置说明

## 🎓 学到的经验

1. **详细日志的重要性** - 能够快速定位问题
2. **分步处理** - 每一步都有清晰的开始和结束标记
3. **性能监控** - 记录每个操作的耗时
4. **错误处理** - 完整的错误堆栈信息
5. **参数验证** - 在每一步都验证关键参数

## 🔄 下一步建议

1. **运行测试** - 使用 `npm run dev` 测试完整流程
2. **监控日志** - 观察日志输出，确保流程正常
3. **性能优化** - 根据日志中的性能指标进行优化
4. **错误处理** - 测试各种错误场景
5. **文档更新** - 根据实际情况更新文档
