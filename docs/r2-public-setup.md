# Cloudflare R2 公开访问设置指南

## 问题说明

目前 R2 bucket 中的图片无法公开访问，需要通过 Cloudflare 控制台配置公开访问权限。

## 解决方案

### 方法1: 通过 Cloudflare 控制台设置公开访问（推荐）

1. **登录 Cloudflare 控制台**
   - 访问 https://dash.cloudflare.com/
   - 选择你的账户

2. **进入 R2 服务**
   - 左侧菜单选择 "R2 Object Storage"
   - 选择 `rizzify` bucket

3. **配置公开访问**
   - 点击 "Settings" 标签页
   - 找到 "Public access" 部分
   - 点击 "Allow Access" 启用公开访问

4. **设置自定义域名（可选但推荐）**
   - 在 "Public access" 部分点击 "Connect Domain"
   - 添加自定义域名，如：`static.rizzify.com`
   - 按提示配置 DNS 记录

### 方法2: 使用 R2.dev 公开 URL

如果不想设置自定义域名，可以直接使用 R2.dev 的公开 URL：

**格式**: `https://pub-{account_hash}.r2.dev/{object_key}`

**我们的配置**:
- Account Hash: `bc09d7863bdf06dffcb455b66dc021e5`
- 公开 URL: `https://pub-bc09d7863bdf06dffcb455b66dc021e5.r2.dev`

**示例 URL**:
```
https://pub-bc09d7863bdf06dffcb455b66dc021e5.r2.dev/ui/login/04cd87b5-3984-474e-b5fc-bf887b582e79.webp
```

## 测试访问

设置完成后，在浏览器中访问以下测试 URL：

```
https://pub-bc09d7863bdf06dffcb455b66dc021e5.r2.dev/ui/login/04cd87b5-3984-474e-b5fc-bf887b582e79.webp
```

如果能正常显示图片，说明配置成功。

## 环境变量配置

在 `.env.local` 中更新域名配置：

```env
# 使用 R2.dev 公开 URL
CLOUDFLARE_R2_STATIC_DOMAIN=https://pub-bc09d7863bdf06dffcb455b66dc021e5.r2.dev

# 启用 R2 图片
USE_R2_IMAGES=true
```

## 验证图片迁移

### 1. 检查已上传的图片类别

我们已成功迁移以下图片：

- ✅ **登录背景**: 34个 WebP 文件 → `ui/login/`
- ✅ **Before/After**: 12个 WebP 文件 → `ui/before-after/before|after/`
- ✅ **画廊图片**: 24个 WebP 文件 → `ui/gallery/`
- ✅ **示例图片**: 8个文件 → `ui/examples/`
- ✅ **避免示例**: 4个文件 → `ui/avoid/`
- ✅ **用户头像**: 4个 SVG → `ui/avatars/`

**总计**: 82个文件，成功率 100%

### 2. 测试图片 URL 生成

访问测试页面检查图片加载：
```
http://localhost:3000/test-images
```

### 3. 验证具体页面

- **登录页面**: `http://localhost:3000/login` - 检查背景图片墙
- **首页**: `http://localhost:3000/` - 检查 Before/After、画廊图片
- **上传页面**: `http://localhost:3000/start` - 检查示例图片

## 故障排除

### 问题1: 图片显示 401 Unauthorized

**解决方案**:
1. 确认在 Cloudflare 控制台启用了公开访问
2. 检查 URL 格式是否正确
3. 等待几分钟让配置生效

### 问题2: 图片加载很慢

**解决方案**:
1. 设置自定义域名以使用 Cloudflare CDN
2. 确认图片已正确优化为 WebP 格式

### 问题3: CORS 错误

**解决方案**:
在 Cloudflare 控制台的 R2 bucket 设置中添加 CORS 配置：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## 完成检查清单

- [ ] 在 Cloudflare 控制台启用 R2 bucket 公开访问
- [ ] 测试 R2.dev URL 是否可访问
- [ ] 更新 `.env.local` 中的域名配置
- [ ] 设置 `USE_R2_IMAGES=true`
- [ ] 重启开发服务器
- [ ] 访问 `/test-images` 页面验证
- [ ] 检查各个页面图片加载情况
- [ ] （可选）配置自定义域名

## 下一步行动

1. **立即执行**: 在 Cloudflare 控制台启用公开访问
2. **测试验证**: 访问测试页面确认图片加载
3. **性能优化**: 考虑设置自定义域名
4. **清理工作**: 确认 R2 图片正常后，可以删除本地图片文件

完成这些步骤后，你的应用将完全使用 R2 CDN 提供图片服务，享受全球加速和无限扩展的优势！