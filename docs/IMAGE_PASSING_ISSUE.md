# 图片传递问题诊断

## 问题描述

用户发现在 API 调用中，图片没有被正确传递给 Apicore API。

### 症状

日志显示：
```
[ApicoreClient]   - Has image: true
[ApicoreClient]   - Size: 1x1
[ApicoreClient]     Payload size: 277 bytes
```

**Payload 只有 277 字节** = 只包含提示词，**没有图片数据**

## 根本原因分析

### 1. API 文档确认

根据 Apicore 官方文档，API **支持直接传递 URL**：

```json
{
  "model": "gemini-2.5-flash-image",
  "prompt": "图像描述文本",
  "image": "https://example.com/image.jpg",  // ✅ 支持 URL
  "size": "1x1",
  "n": 1
}
```

所以**不需要 Base64 转换**。

### 2. 问题定位

**美颜处理流程**：
```
用户上传图片 URL
  ↓
BeautifyProcessor.process(userImageUrl)
  ├─ 传给 API: image: userImageUrl ✅
  ├─ API 返回美颜图片 URL
  └─ 保存到 beautifyResult.imageUrl

生成风格照片流程
  ↓
RealWorker 生成请求
  ├─ 传给 API: image: beautifyResult.imageUrl ✅
  └─ 应该正确传递
```

### 3. 实际问题

**Payload 大小只有 277 字节**说明：
- ❌ `request.image` 字段可能为 `undefined` 或 `null`
- ❌ 或者 `request.image` 被过滤掉了

## 解决方案

### 第 1 步：增强日志（已完成）

在 `src/lib/apicore-client.ts` 中添加详细日志：

```typescript
if (request.image) {
  console.log(`[ApicoreClient]     Image field length: ${request.image.length} chars`);
  console.log(`[ApicoreClient]     Image field preview: ${request.image.substring(0, 100)}...`);
}
```

### 第 2 步：测试流程

1. 上传图片
2. 选择 Free 计划
3. **观察日志中的 `Image field length` 和 `Image field preview`**
4. 确认图片 URL 是否被正确传递

### 第 3 步：可能的修复

如果日志显示 `Image field length: undefined`，则需要检查：

**选项 A：检查 GenerationRequest 接口**
```typescript
export interface GenerationRequest {
  prompt: string;
  image?: string;  // ✅ 确保是可选的
  n?: number;
  size?: '1x1' | '16:9' | '9:16';
}
```

**选项 B：检查 payload 构建逻辑**
```typescript
const payload = {
  model: this.model,
  prompt: request.prompt,
  n: request.n || 1,
  size: request.size || '1x1',
  ...(request.image && { image: request.image }),  // ✅ 只在有 image 时才添加
};
```

**选项 C：检查调用方是否传递了 image**
```typescript
// BeautifyProcessor
const generationRequest: GenerationRequest = {
  prompt: this.beautifyPrompt,
  image: userImageUrl,  // ✅ 确保这里有值
  n: 1,
  size: '1x1',
};

// RealWorker
const generationRequests = batchPrompts.map((p) => ({
  prompt: p.text,
  image: beautifyResult.imageUrl,  // ✅ 确保这里有值
  n: 1,
  size: '1x1' as const,
}));
```

## 测试步骤

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **上传图片并选择 Free 计划**

3. **查看日志中的这些行**：
   ```
   [ApicoreClient]     Image field length: XXXX chars
   [ApicoreClient]     Image field preview: https://...
   ```

4. **如果看到这些日志，说明图片正确传递了**

5. **如果没有看到这些日志，说明 `request.image` 为 undefined**

## 预期结果

修复后，日志应该显示：
```
[ApicoreClient]     Image field length: 120 chars
[ApicoreClient]     Image field preview: https://rizzify.org/uploads/1761052873437-...
[ApicoreClient]     Payload size: 1200 bytes  // ✅ 大幅增加，包含了图片 URL
```

## 相关文件

- `src/lib/apicore-client.ts` - API 客户端（已添加详细日志）
- `src/lib/beautify-processor.ts` - 美颜处理器
- `src/worker/real-worker.ts` - Worker 主逻辑
