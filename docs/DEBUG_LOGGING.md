# 调试日志参考

## 日志位置和内容

### 1️⃣ BeautifyProcessor - 美颜请求参数

```
[BeautifyProcessor] ========== BEAUTIFY REQUEST PARAMS ==========
[BeautifyProcessor] Prompt: 保持此人面部结构、五官比例与肤色一致...
[BeautifyProcessor] Image URL: https://rizzify.org/uploads/...
[BeautifyProcessor] Image length: 120 chars
[BeautifyProcessor] N (count): 1
[BeautifyProcessor] Size: 1x1
[BeautifyProcessor] ========== END REQUEST PARAMS ==========
```

**检查项**：
- ✅ `Image URL` 是否有值（不是 undefined）
- ✅ `Image length` 是否 > 0
- ✅ 其他参数是否正确

---

### 2️⃣ ApicoreClient - 完整 Payload 日志

```
[ApicoreClient]     ========== FULL PAYLOAD ==========
[ApicoreClient]     Model: gemini-2.5-flash-image-vip
[ApicoreClient]     Prompt: 保持此人面部结构、五官比例与肤色一致...
[ApicoreClient]     N (count): 1
[ApicoreClient]     Size: 1x1
[ApicoreClient]     Has image: true
[ApicoreClient]     Image length: 120 chars
[ApicoreClient]     Image type: URL
[ApicoreClient]     Image preview: https://rizzify.org/uploads/...
[ApicoreClient]     Total payload size: 1200 bytes
[ApicoreClient]     ========== END PAYLOAD ==========
```

**检查项**：
- ✅ `Has image: true` 是否为真
- ✅ `Image length` 是否 > 0
- ✅ `Image type` 是 URL 还是 Base64
- ✅ `Total payload size` 是否足够大（包含图片 URL）

---

### 3️⃣ RealWorker - 风格照片请求参数

```
[RealWorker] ========== STYLED PHOTO REQUEST PARAMS ==========
[RealWorker] Number of requests: 2
[RealWorker] Request 1:
[RealWorker]   - Prompt: 将此照片生成写实的门店外环境人像...
[RealWorker]   - Image URL: https://img.apicore.ai/f/9998238947019380-...
[RealWorker]   - Image length: 95 chars
[RealWorker]   - N (count): 1
[RealWorker]   - Size: 1x1
[RealWorker] Request 2:
[RealWorker]   - Prompt: 将此照片生成写实的近距离特写人像...
[RealWorker]   - Image URL: https://img.apicore.ai/f/9998238947019380-...
[RealWorker]   - Image length: 95 chars
[RealWorker]   - N (count): 1
[RealWorker]   - Size: 1x1
[RealWorker] ========== END REQUEST PARAMS ==========
```

**检查项**：
- ✅ `Number of requests` 是否正确（Free=2, Start=30, Pro=70）
- ✅ 每个请求的 `Image URL` 是否有值
- ✅ `Image length` 是否都 > 0

---

## 完整日志流程

### 美颜处理

```
[RealWorker] ========== STEP 4: BEAUTIFY PROCESSING ==========
[RealWorker] Starting beautify for image: https://rizzify.org/uploads/...

[BeautifyProcessor] ========== BEAUTIFY PROCESS START ==========
[BeautifyProcessor] Task ID: ...
[BeautifyProcessor] Input image URL: https://rizzify.org/uploads/...
[BeautifyProcessor] Beautify prompt: 保持此人面部结构...

[BeautifyProcessor] Step 1: Calling Apicore API for beautification...
[BeautifyProcessor] ========== BEAUTIFY REQUEST PARAMS ==========
[BeautifyProcessor] Prompt: 保持此人面部结构...
[BeautifyProcessor] Image URL: https://rizzify.org/uploads/...  ← 用户上传的图片
[BeautifyProcessor] Image length: 120 chars
[BeautifyProcessor] N (count): 1
[BeautifyProcessor] Size: 1x1
[BeautifyProcessor] ========== END REQUEST PARAMS ==========

[ApicoreClient] ========== GENERATE START ==========
[ApicoreClient] ========== FULL PAYLOAD ==========
[ApicoreClient] Model: gemini-2.5-flash-image-vip
[ApicoreClient] Prompt: 保持此人面部结构...
[ApicoreClient] Has image: true
[ApicoreClient] Image length: 120 chars
[ApicoreClient] Image type: URL
[ApicoreClient] Image preview: https://rizzify.org/uploads/...  ← 确认图片被传递
[ApicoreClient] Total payload size: 1200 bytes  ← 包含了图片 URL
[ApicoreClient] ========== END PAYLOAD ==========

[ApicoreClient] Calling API: https://api.apicore.ai/v1/images/generations
[ApicoreClient] Response received in 13814ms (status: 200)
[ApicoreClient] ✅ API returned 1 image(s)

[BeautifyProcessor] ✅ API returned 1 image URL(s)
[BeautifyProcessor] Beautified image URL: https://img.apicore.ai/f/9998238947019380-...  ← 美颜结果
```

### 风格照片生成

```
[RealWorker] ========== STEP 6: GENERATE STYLED PHOTOS ==========
[RealWorker] Total images to generate: 2

[RealWorker] --- BATCH 1/1 ---
[RealWorker] Processing 2 prompts (indices 0-1)
[RealWorker] Calling Apicore API...

[RealWorker] ========== STYLED PHOTO REQUEST PARAMS ==========
[RealWorker] Number of requests: 2
[RealWorker] Request 1:
[RealWorker]   - Prompt: 将此照片生成写实的门店外环境人像...
[RealWorker]   - Image URL: https://img.apicore.ai/f/9998238947019380-...  ← 美颜图片
[RealWorker]   - Image length: 95 chars
[RealWorker] Request 2:
[RealWorker]   - Prompt: 将此照片生成写实的近距离特写人像...
[RealWorker]   - Image URL: https://img.apicore.ai/f/9998238947019380-...  ← 美颜图片
[RealWorker]   - Image length: 95 chars
[RealWorker] ========== END REQUEST PARAMS ==========

[ApicoreClient] ========== GENERATE START ==========
[ApicoreClient] Generating 2 image(s)

[ApicoreClient] Processing request 1/2
[ApicoreClient] ========== FULL PAYLOAD ==========
[ApicoreClient] Model: gemini-2.5-flash-image-vip
[ApicoreClient] Prompt: 将此照片生成写实的门店外环境人像...
[ApicoreClient] Has image: true
[ApicoreClient] Image length: 95 chars
[ApicoreClient] Image type: URL
[ApicoreClient] Image preview: https://img.apicore.ai/f/9998238947019380-...  ← 确认美颜图片被传递
[ApicoreClient] Total payload size: 1300 bytes
[ApicoreClient] ========== END PAYLOAD ==========
```

---

## 问题诊断

### 问题 1：Image URL 为 undefined

**症状**：
```
[BeautifyProcessor] Image URL: undefined
[ApicoreClient] Has image: false
```

**原因**：
- `userImageUrl` 没有被正确传递
- 或者 `beautifyResult.imageUrl` 为空

**解决**：
- 检查 Upload 记录是否正确创建
- 检查 R2 URL 是否有效

---

### 问题 2：Image length 为 0

**症状**：
```
[BeautifyProcessor] Image length: 0 chars
```

**原因**：
- 图片 URL 为空字符串
- 或者 URL 被截断

**解决**：
- 检查 R2 配置
- 检查 URL 生成逻辑

---

### 问题 3：Payload size 太小

**症状**：
```
[ApicoreClient] Total payload size: 277 bytes
```

**原因**：
- 图片 URL 没有被包含在 payload 中
- `request.image` 为 undefined 或 null

**解决**：
- 检查 `GenerationRequest` 接口
- 检查调用方是否传递了 `image` 参数

---

## 快速检查清单

上传图片并选择 Free 计划后，查看日志：

- [ ] `[BeautifyProcessor] Image URL:` 有值吗？
- [ ] `[BeautifyProcessor] Image length:` > 0 吗？
- [ ] `[ApicoreClient] Has image: true` 吗？
- [ ] `[ApicoreClient] Image length:` > 0 吗？
- [ ] `[ApicoreClient] Total payload size:` > 500 bytes 吗？
- [ ] `[RealWorker] Image URL:` 有值吗？
- [ ] 所有 API 调用都返回 200 状态码吗？

如果所有项都是 ✅，说明参数传递正确！
