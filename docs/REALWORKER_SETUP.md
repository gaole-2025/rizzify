# RealWorker 自动启动配置

## ✅ 已完成的配置

### 1. 创建启动脚本
- **文件**: `src/worker/start-real-worker.ts`
- **功能**:
  - 启动 RealWorker
  - 处理 SIGINT/SIGTERM 信号
  - 优雅关闭

### 2. 更新 package.json 脚本

#### 主要脚本
```json
{
  "dev": "concurrently \"npm run dev:web\" \"npm run worker\" --kill-others-on-exit",
  "worker": "tsx src/worker/start-real-worker.ts",
  "worker:mock": "tsx src/worker/task-worker.ts"
}
```

#### 新增脚本
```json
{
  "dev:mock": "concurrently \"npm run dev:web\" \"npm run worker:mock\" --kill-others-on-exit",
  "test:api": "tsx scripts/test-api-integration.ts",
  "build-catalogs": "node scripts/build-catalogs.js"
}
```

---

## 🚀 使用方法

### 启动 RealWorker（推荐）
```bash
npm run dev
```
✅ 自动启动 Next.js Web 服务器（端口 3000）
✅ 自动启动 RealWorker 处理任务
✅ 任一进程退出时，另一个也会自动退出

### 启动 MockWorker（模拟生成）
```bash
npm run dev:mock
```
✅ 使用模拟 Worker（不调用 Apicore API）
✅ 用于测试和演示

### 仅启动 Web 服务器
```bash
npm run dev:web-only
```
⚠️ 不启动 Worker，任务不会被处理

### 测试 API 模块
```bash
npm run test:api
```
✅ 验证所有模块初始化成功

### 重建提示词目录
```bash
npm run build-catalogs
```
✅ 从 rules/prompt2.txt 和 rules/prompt3.txt 重建目录

---

## 📊 工作流程

### `npm run dev` 启动时发生的事情

```
┌─────────────────────────────────────────────┐
│  npm run dev                                 │
└─────────────────────────────────────────────┘
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
┌─────────────────┐         ┌──────────────────┐
│ npm run dev:web │         │ npm run worker   │
│                 │         │                  │
│ Next.js Server  │         │ RealWorker       │
│ Port: 3000      │         │ pg-boss Queue    │
└─────────────────┘         └──────────────────┘
    ↓                               ↓
  Web UI                    Task Processing
  (Upload/Results)          (Beautify/Generate)
```

---

## ⚙️ 配置说明

### concurrently 选项
- `--kill-others-on-exit`: 当一个进程退出时，自动杀死其他进程
- 这确保了优雅的关闭

### RealWorker 特性
- ✅ 自动连接到 pg-boss 队列
- ✅ 处理 `task_generate` 队列中的任务
- ✅ 支持 SIGINT/SIGTERM 优雅关闭
- ✅ 实时日志输出

---

## 🔍 监控和调试

### 查看 Worker 日志
```bash
npm run dev
```
输出示例：
```
🚀 Starting Rizzify RealWorker...
[RealWorker] Starting real worker...
[RealWorker] Real worker started successfully
[RealWorker] Team size: 1
[RealWorker] Check interval: 5s
✅ RealWorker is running and ready to process tasks
```

### 查看任务处理日志
当任务被处理时，你会看到：
```
[RealWorker] Starting generation for task: task-123
[RealWorker] Config: plan=free, gender=male, style=casual
[RealWorker] Found upload: user-photo.jpg
[RealWorker] Starting beautify processing...
[RealWorker] Beautify completed for task: task-123
[RealWorker] Sampled 2 prompts for plan=free, gender=male
[RealWorker] Generating 2 images in 1 batches
...
```

---

## 🛑 停止 Worker

### 正常关闭
按 `Ctrl+C` 在终端中，两个进程都会优雅地关闭

### 强制关闭
```bash
# 杀死所有 Node 进程
pkill -f node
```

---

## ✨ 关键特性

- ✅ **自动启动** - `npm run dev` 时自动启动 RealWorker
- ✅ **并行运行** - Web 和 Worker 同时运行
- ✅ **优雅关闭** - 一个进程退出时自动关闭另一个
- ✅ **灵活切换** - 可随时切换到 MockWorker（`npm run dev:mock`）
- ✅ **实时日志** - 完整的任务处理日志

---

## 📝 故障排除

### RealWorker 无法启动
1. 检查数据库连接：`npm run db:smoke`
2. 检查环境变量：`cat .env | grep APIORE`
3. 检查 pg-boss 连接：查看日志中的错误信息

### 任务无法被处理
1. 确保 RealWorker 正在运行：查看日志中的 "ready to process tasks"
2. 确保任务已入队：检查数据库中的 Task 记录
3. 检查 API 密钥是否正确配置

### 内存占用过高
1. 减少 `APICORE_BATCH_SIZE`（默认 5）
2. 增加 `APICORE_TIMEOUT_MS`（默认 15000）
3. 检查临时文件是否被正确清理

---

**配置完成！** 现在可以运行 `npm run dev` 来启动完整的开发环境。
