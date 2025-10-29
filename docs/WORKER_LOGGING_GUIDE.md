# Worker 详细日志指南

## 概述

已为 RealWorker 及其所有依赖模块添加了详细的分步日志记录。这使得调试和追踪任务处理流程变得更加容易。

## 日志覆盖范围

### 1️⃣ RealWorker (`src/worker/real-worker.ts`)

**日志步骤**：
- ✅ JOB RECEIVED - 接收任务
- ✅ JOB PARSED - 解析任务数据
- ✅ STEP 1: UPDATE STATUS TO RUNNING - 更新任务状态
- ✅ STEP 2: FETCH UPLOAD - 获取上传的图片
- ✅ STEP 3: CREATE UPLOADED PHOTO RECORD - 创建上传照片记录
- ✅ STEP 4: BEAUTIFY PROCESSING - 美颜处理
- ✅ STEP 5: SAMPLE PROMPTS - 采样提示词
- ✅ STEP 6: GENERATE STYLED PHOTOS - 生成风格照片（批处理）
- ✅ STEP 7: FINALIZE TASK - 完成任务

**输出示例**：
```
================================================================================
[RealWorker] ========== JOB RECEIVED ==========
[RealWorker] Received job: [...]
[RealWorker] ========== JOB PARSED ==========
[RealWorker] taskId: 695170b3-da7d-4ee3-ba96-192f3da38ed6
[RealWorker] uploadId: c5aa0f76-addf-4e40-9bcf-51fd1e9d2ebf
[RealWorker] plan: free
...
```

### 2️⃣ BeautifyProcessor (`src/lib/beautify-processor.ts`)

**日志步骤**：
- ✅ BEAUTIFY PROCESS START - 开始美颜处理
- ✅ Step 1: Calling Apicore API for beautification - 调用 API
- ✅ Step 2: Downloading and uploading to R2 - 下载并上传
- ✅ Step 3: Getting image metadata - 获取元数据
- ✅ BEAUTIFY PROCESS COMPLETED - 完成

**输出示例**：
```
[BeautifyProcessor] ========== BEAUTIFY PROCESS START ==========
[BeautifyProcessor] Task ID: 695170b3-da7d-4ee3-ba96-192f3da38ed6
[BeautifyProcessor] Input image URL: https://rizzify.org/uploads/...
[BeautifyProcessor] Step 1: Calling Apicore API for beautification...
[BeautifyProcessor] ✅ API returned 1 image URL(s)
```

### 3️⃣ ApicoreClient (`src/lib/apicore-client.ts`)

**日志步骤**：
- ✅ GENERATE START - 开始生成
- ✅ Processing request N/M - 处理每个请求
- ✅ Attempt N/M - 重试尝试
- ✅ API call details - API 调用详情
- ✅ GENERATE COMPLETED - 完成

**输出示例**：
```
[ApicoreClient] ========== GENERATE START ==========
[ApicoreClient] Generating 1 image(s)
[ApicoreClient] Model: gemini-2.5-flash-image
[ApicoreClient] Timeout: 120000ms
[ApicoreClient] Max retries: 3

[ApicoreClient] Processing request 1/1
[ApicoreClient]   Attempt 1/3...
[ApicoreClient]     Calling API: https://api.apicore.ai/v1/images/generations
[ApicoreClient]     Timeout: 120000ms
[ApicoreClient]     Response received in 8234ms (status: 200)
[ApicoreClient]     ✅ API returned 1 image(s)
```

### 4️⃣ ImageManager (`src/lib/image-manager.ts`)

**日志步骤**：
- ✅ DOWNLOAD AND UPLOAD START - 开始下载和上传
- ✅ Downloading image from URL - 下载图片
- ✅ Uploading to R2 - 上传到 R2
- ✅ Cleanup - 清理临时文件
- ✅ DOWNLOAD AND UPLOAD COMPLETED - 完成

**输出示例**：
```
[ImageManager] ========== DOWNLOAD AND UPLOAD START ==========
[ImageManager] Downloading image from URL...
[ImageManager]   - URL: https://lh3.googleusercontent.com/...
[ImageManager] ✅ Downloaded 45678 bytes in 1234ms
[ImageManager] Uploading to R2...
[ImageManager]   - Bucket: rizzify
[ImageManager]   - Object key: results/695170b3.../beautified/001.jpg
[ImageManager] ✅ Uploaded in 567ms
```

## 日志输出格式

所有日志都遵循统一的格式：

```
[ModuleName] [Status/Step] Message
```

### 状态符号

- ✅ - 成功
- ❌ - 失败
- ⚠️ - 警告
- 📊 - 进度/统计
- 🔄 - 重试

## 调试技巧

### 1. 追踪任务流程

查看完整的任务处理流程：

```bash
npm run dev 2>&1 | grep "\[RealWorker\]"
```

### 2. 查看 API 调用

```bash
npm run dev 2>&1 | grep "\[ApicoreClient\]"
```

### 3. 查看图片处理

```bash
npm run dev 2>&1 | grep "\[ImageManager\]"
```

### 4. 查看美颜处理

```bash
npm run dev 2>&1 | grep "\[BeautifyProcessor\]"
```

### 5. 查看所有错误

```bash
npm run dev 2>&1 | grep "❌"
```

## 性能指标

日志中包含的性能指标：

- **API 响应时间** - 从发送请求到收到响应的时间
- **下载时间** - 从 URL 下载图片的时间
- **上传时间** - 上传到 R2 的时间
- **处理时间** - 整个任务的总处理时间
- **重试次数** - API 调用的重试次数

## 常见问题排查

### API 超时

查看日志中的 `Timeout` 值和 `Response received in` 时间：

```
[ApicoreClient] Timeout: 120000ms
[ApicoreClient] Response received in 8234ms (status: 200)
```

如果响应时间接近超时时间，可能需要增加超时值。

### 图片下载失败

查看 ImageManager 的日志：

```
[ImageManager] ❌ Download failed: Failed to download image: 404
```

检查 URL 是否有效。

### R2 上传失败

查看 ImageManager 的上传日志：

```
[ImageManager] ❌ Upload failed: NoSuchBucket
```

检查 R2 配置和权限。

## 日志级别

虽然目前所有日志都使用 `console.log` 和 `console.error`，但可以根据需要扩展为不同的日志级别：

- `DEBUG` - 详细的调试信息
- `INFO` - 一般信息
- `WARN` - 警告信息
- `ERROR` - 错误信息

## 下一步

可以考虑的改进：

1. **日志持久化** - 将日志保存到文件
2. **日志聚合** - 使用 ELK Stack 或类似工具
3. **性能监控** - 添加更多性能指标
4. **错误追踪** - 集成 Sentry 或类似工具
5. **可视化** - 创建仪表板显示实时日志

## 配置

日志配置可以通过环境变量控制（如果需要）：

```env
LOG_LEVEL=DEBUG
LOG_FILE=./logs/worker.log
LOG_FORMAT=json
```

目前这些配置还未实现，但可以作为未来的增强功能。
