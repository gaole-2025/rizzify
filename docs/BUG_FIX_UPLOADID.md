# Bug Fix: uploadId 未传递导致任务失败

## 🐛 问题描述

RealWorker 在处理任务时报错：
```
Invalid `prisma.upload.findUnique()` invocation
Argument `where` of type UploadWhereUniqueInput needs at least one of `id` arguments.
```

**根本原因**：`uploadId` 是 `undefined`，导致无法查询 Upload 记录。

---

## 🔍 问题分析

### 错误堆栈
```
[RealWorker] Starting generation for task: 41824659-a295-45d3-a6f2-bd378ebd101d
const upload = await prisma.upload.findUnique({
  where: { id: undefined }  // ❌ uploadId 是 undefined
})
```

### 根本原因
1. `TaskGenerationJob` 接口中没有定义 `uploadId` 字段
2. API 在调用 `enqueueTaskGeneration()` 时没有传递 `uploadId`
3. RealWorker 从 jobData 中解构 `uploadId` 时得到 `undefined`

---

## ✅ 修复方案

### 1. 更新 `src/lib/queue.ts`
添加 `uploadId` 到 `TaskGenerationJob` 接口：

```typescript
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
```

### 2. 更新 `app/api/generation/start/route.ts`
在 `enqueueTaskGeneration()` 调用中传递 `uploadId`：

```typescript
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

### 3. RealWorker 自动获取
`src/worker/real-worker.ts` 第 40 行已经正确解构：

```typescript
const { taskId, userId, plan, gender, style, uploadId } = jobData;
```

现在 `uploadId` 不再是 `undefined`，可以正确查询 Upload 记录。

---

## 🧪 验证

修复后，RealWorker 应该能够：

1. ✅ 接收任务并获取 `uploadId`
2. ✅ 查询 Upload 记录：`prisma.upload.findUnique({ where: { id: uploadId } })`
3. ✅ 获取用户上传的图片 URL
4. ✅ 继续执行美颜处理和图片生成

---

## 📝 变更清单

| 文件 | 变更 |
|------|------|
| `src/lib/queue.ts` | 添加 `uploadId: string` 到 `TaskGenerationJob` |
| `app/api/generation/start/route.ts` | 传递 `uploadId: upload.id` |

---

## 🚀 下一步

现在可以重新运行 `npm run dev` 进行测试：

```bash
npm run dev
```

任务应该能够正常处理，不再出现 `uploadId undefined` 的错误。
