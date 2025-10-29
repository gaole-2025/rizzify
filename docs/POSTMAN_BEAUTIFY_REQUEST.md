# Postman 美颜 API 调用指南

## API 基本信息

- **URL**: `https://api.apicore.ai/v1/images/generations`
- **方法**: POST
- **Content-Type**: application/json
- **认证**: Bearer Token

## 请求头 (Headers)

```
Authorization: Bearer sk-SW83XkOJgC2UolayshCJABVENSFGgV2eFk0Hyvpd3JdvBik9
Content-Type: application/json
```

## 请求体 (Body - JSON)

```json
{
  "model": "gemini-2.5-flash-image-vip",
  "prompt": "https://rizzify.org/uploads/1761053889214-5099656b-4091-45a6-820b-8bc13fa87a95-image_1761053889214_0tyzah.jpg 保持此人面部结构、五官比例与肤色一致；在不改变身份的前提下进行中度专业修图：去皮屑与瑕疵但保留真实毛孔与皮肤纹理；细致修整眉型与发际线；不要过度磨皮；让皮肤呈现健康的中性光泽。",
  "size": "1x1",
  "n": 1
}
```

## 参数详解

| 参数 | 值 | 说明 |
|------|-----|------|
| **model** | `gemini-2.5-flash-image-vip` | 使用的模型 |
| **prompt** | `URL + 空格 + 提示词` | **URL 和提示词在同一个 prompt 字段中，用空格分隔** |
| **size** | `1x1` | 图片尺寸比例 |
| **n** | `1` | 生成 1 张图片 |

## 美颜提示词（完整）

```
保持此人面部结构、五官比例与肤色一致；在不改变身份的前提下进行中度专业修图：去皮屑与瑕疵但保留真实毛孔与皮肤纹理；细致修整眉型与发际线；不要过度磨皮；让皮肤呈现健康的中性光泽。
```

**提示词长度**: 108 字符

## 预期响应

```json
{
  "created": 1760425338,
  "data": [
    {
      "url": "https://img.apicore.ai/f/9998238946020156-1f64656f-e05d-4142-8c99-f9e3f5534c83.png"
    }
  ],
  "model": "gemini-2.5-flash-image-preview"
}
```

## Postman 步骤

### 1. 创建新请求
- 点击 "New" → "Request"
- 名称: "Beautify API Test"

### 2. 设置请求方法和 URL
- 方法: **POST**
- URL: `https://api.apicore.ai/v1/images/generations`

### 3. 设置 Headers
- 点击 "Headers" 标签
- 添加:
  ```
  Key: Authorization
  Value: Bearer sk-SW83XkOJgC2UolayshCJABVENSFGgV2eFk0Hyvpd3JdvBik9
  
  Key: Content-Type
  Value: application/json
  ```

### 4. 设置 Body
- 点击 "Body" 标签
- 选择 "raw" 和 "JSON"
- 粘贴下面的 JSON:

```json
{
  "model": "gemini-2.5-flash-image-vip",
  "prompt": "https://rizzify.org/uploads/1761053889214-5099656b-4091-45a6-820b-8bc13fa87a95-image_1761053889214_0tyzah.jpg 保持此人面部结构、五官比例与肤色一致；在不改变身份的前提下进行中度专业修图：去皮屑与瑕疵但保留真实毛孔与皮肤纹理；细致修整眉型与发际线；不要过度磨皮；让皮肤呈现健康的中性光泽。",
  "size": "1x1",
  "n": 1
}
```

**⚠️ 注意**: prompt 字段包含 **URL + 空格 + 提示词**，不要分开！

### 5. 点击 Send

## 测试结果

- ✅ **状态码 200** - 成功
- ✅ **响应包含 `data[0].url`** - 美颜图片 URL
- ❌ **其他状态码** - 检查错误信息

## 常见问题

### Q: 为什么返回 401？
A: API Key 过期或错误。检查 Authorization header。

### Q: 为什么返回 400？
A: 检查 JSON 格式是否正确，特别是中文字符编码。

### Q: 为什么返回 500？
A: API 服务器错误，稍后重试。

### Q: 图片 URL 可以用本地文件吗？
A: 不行，必须是公网可访问的 URL。

## 日志参考

从应用日志中提取的实际调用参数（修复后）：

```
[ApicoreClient] Processing request 1/1
[ApicoreClient]   - Prompt length: 217 chars
[ApicoreClient]   - Prompt: https://rizzify.org/uploads/1761053889214-5099656b-4091-45a6-820b-8bc13fa87a95-image_1761053889214_0tyzah.jpg 保持此人面部结构、五官比例与肤色一致；在不改变身份的前提下进行中度专业修图：去皮屑与瑕疵但保留真实毛孔与皮肤纹理；细致修整眉型与发际线；不要过度磨皮；让皮肤呈现健康的中性光泽。
[ApicoreClient]   - Size: 1x1

[ApicoreClient]     ========== FULL PAYLOAD ==========
[ApicoreClient]     Model: gemini-2.5-flash-image-vip
[ApicoreClient]     Prompt length: 217 chars
[ApicoreClient]     Prompt: https://rizzify.org/uploads/1761053889214-5099656b-4091-45a6-820b-8bc13fa87a95-image_1761053889214_0tyzah.jpg 保持此人面部结构、五官比例与肤色一致；在不改变身份的前提下进行中度专业修图：去皮屑与瑕疵但保留真实毛孔与皮肤纹理；细致修整眉型与发际线；不要过度磨皮；让皮肤呈现健康的中性光泽。
[ApicoreClient]     N (count): 1
[ApicoreClient]     Size: 1x1
[ApicoreClient]     Image URL: https://rizzify.org/uploads/1761053889214-5099656b-4091-45a6-820b-8bc13fa87a95-image_1761053889214_0tyzah.jpg
[ApicoreClient]     Total payload size: 380 bytes

[ApicoreClient]     Response received in 6238ms (status: 200)
[ApicoreClient]     ✅ API returned 1 image(s)
```

## 实际响应示例

```json
{
  "created": 1761053895,
  "data": [
    {
      "url": "https://img.apicore.ai/f/9998238946020156-1f64656f-e05d-4142-8c99-f9e3f5534c83.png"
    }
  ],
  "model": "gemini-2.5-flash-image-preview"
}
```

**响应时间**: 6-12 秒
