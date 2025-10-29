# RealWorker 快速参考

## 🚀 启动

```bash
npm run dev
```

## 📋 工作流程

```
用户上传图片
    ↓
选择计划 (free/start/pro)
    ↓
API 创建 Task 记录
    ↓
任务入队到 pg-boss
    ↓
RealWorker 接收任务
    ↓
更新任务状态为 running
    ↓
获取上传的图片
    ↓
创建 uploaded Photo 记录
    ↓
美颜处理（Apicore API）
    ↓
创建 beautified Photo 记录
    ↓
采样提示词
    ↓
分批生成图片（Apicore API）
    ↓
下载并上传到 R2
    ↓
创建 Photo 记录
    ↓
更新任务状态为 done
    ↓
用户在 /results 页面查看
```

## 📊 关键参数

| 参数 | 值 | 说明 |
|------|-----|------|
| API 超时 | 120s | 每次 API 调用最多等待 120 秒 |
| 重试次数 | 3 | API 失败后最多重试 3 次 |
| 重试间隔 | 10s | 每次重试间隔 10 秒 |
| 批大小 | 5 | 每批最多生成 5 张图片 |
| Free 数量 | 2 | Free 计划生成 2 张图片 |
| Start 数量 | 30 | Start 计划生成 30 张图片 |
| Pro 数量 | 70 | Pro 计划生成 70 张图片 |

## 🔍 查看日志

### 完整流程
```bash
npm run dev 2>&1 | grep -E "\[RealWorker\]|\[BeautifyProcessor\]|\[ApicoreClient\]|\[ImageManager\]"
```

### 仅 RealWorker
```bash
npm run dev 2>&1 | grep "\[RealWorker\]"
```

### 仅 API 调用
```bash
npm run dev 2>&1 | grep "\[ApicoreClient\]"
```

### 仅错误
```bash
npm run dev 2>&1 | grep "❌"
```

### 性能指标
```bash
npm run dev 2>&1 | grep -E "ms|seconds"
```

## ⏱️ 时间预估

| 计划 | 时间 | 说明 |
|------|------|------|
| Free | 30-45s | 2 张图片 |
| Start | 3-5 分钟 | 30 张图片 |
| Pro | 7-10 分钟 | 70 张图片 |

## 🐛 常见问题

### API 超时

**症状**：日志显示 `AbortError: This operation was aborted`

**原因**：API 响应时间超过 120 秒

**解决**：
1. 检查网络连接
2. 检查 API 服务状态
3. 增加超时时间（`.env` 中的 `APIORE_TIMEOUT_MS`）

### uploadId 未定义

**症状**：`Upload not found: undefined`

**原因**：uploadId 没有被正确传递

**解决**：已修复，确保使用最新代码

### 图片下载失败

**症状**：`ImageManager] ❌ Download failed`

**原因**：图片 URL 无效或网络问题

**解决**：
1. 检查 URL 是否有效
2. 检查网络连接
3. 检查 Cloudflare R2 配置

### R2 上传失败

**症状**：`ImageManager] ❌ Upload failed: NoSuchBucket`

**原因**：R2 配置错误或权限不足

**解决**：
1. 检查 `.env` 中的 R2 配置
2. 检查 IAM 权限
3. 检查 Bucket 名称

## 📁 关键文件

| 文件 | 说明 |
|------|------|
| `src/worker/real-worker.ts` | RealWorker 主逻辑 |
| `src/worker/start-real-worker.ts` | RealWorker 启动脚本 |
| `src/lib/beautify-processor.ts` | 美颜处理 |
| `src/lib/apicore-client.ts` | Apicore API 客户端 |
| `src/lib/image-manager.ts` | 图片下载/上传管理 |
| `src/lib/queue.ts` | pg-boss 队列配置 |
| `app/api/generation/start/route.ts` | 任务入队 API |

## 🔧 环境变量

```env
# API 配置
APIORE_API_KEY=sk-...
APIORE_API_URL=https://api.apicore.ai/v1/images/generations
APIORE_MODEL=gemini-2.5-flash-image
APIORE_MAX_RETRIES=3
APIORE_BATCH_SIZE=5
APIORE_TIMEOUT_MS=120000

# 计划配置
PLAN_FREE_COUNT=2
PLAN_START_COUNT=30
PLAN_PRO_COUNT=70

# 美颜提示词
BEAUTIFY_PROMPT=保持此人面部结构...

# 数据库
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# R2 配置
CLOUDFLARE_R2_ENDPOINT=https://...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_RESULTS_BUCKET=rizzify
CLOUDFLARE_R2_USER_DATA_DOMAIN=https://rizzify.org
```

## 📚 文档

- `docs/WORKER_IMPROVEMENTS_SUMMARY.md` - 改进总结
- `docs/WORKER_LOGGING_GUIDE.md` - 详细日志指南
- `docs/BUG_FIX_UPLOADID.md` - uploadId 修复说明
- `docs/API_TIMEOUT_CONFIG.md` - API 超时配置说明
- `docs/REALWORKER_SETUP.md` - RealWorker 设置说明

## 🎯 测试步骤

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **打开浏览器**
   ```
   http://localhost:3000
   ```

3. **上传图片**
   - 进入 `/start` 页面
   - 上传一张图片
   - 选择性别

4. **选择计划**
   - 进入 `/gen-image` 页面
   - 选择 Free 计划（最快）

5. **观察日志**
   - 在终端查看详细的日志输出
   - 追踪任务处理流程

6. **查看结果**
   - 进入 `/results` 页面
   - 查看生成的图片

## 💡 提示

- 使用 Free 计划进行测试（最快）
- 观察日志中的性能指标
- 检查 R2 中的图片是否正确上传
- 检查数据库中的 Photo 记录是否正确创建

## 🆘 获取帮助

1. **查看日志** - 大多数问题都能从日志中看出
2. **检查配置** - 确保所有环境变量都正确设置
3. **查看文档** - 参考相关的文档文件
4. **检查网络** - 确保网络连接正常
