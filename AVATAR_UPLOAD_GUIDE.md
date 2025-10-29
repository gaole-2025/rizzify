# 👤 用户头像上传指南

## 概述

本指南说明如何将用户头像从 JPG 转换为 WebP 格式，上传到 R2，并更新项目配置。

## 前置条件

1. ✅ 已安装 Node.js 和 npm/pnpm
2. ✅ 已安装依赖：`sharp` 和 `@aws-sdk/client-s3`
3. ✅ 已配置 R2 环境变量

## 环境变量配置

在 `.env` 或 `.env.local` 中配置以下变量：

```bash
# Cloudflare R2 配置
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=rizzify
```

## 源文件

项目中已有 4 个用户头像文件（JPG 格式）：

```
public/images/
├── pexels-116281951-12089085.jpg      → mia.webp (Mia, 27, London)
├── pexels-max-medyk-3108397-23885853.jpg → leo.webp (Leo, 29, Berlin)
├── pexels-saulo-leite-1491182-19719795.jpg → ava.webp (Ava, 26, New York)
└── pexels-trace-2834009.jpg            → ken.webp (Ken, 31, Singapore)
```

## 执行步骤

### 步骤 1：运行转换和上传脚本

```bash
# 使用 Node.js 直接运行
node scripts/process-avatars.js

# 或者使用 npm 脚本（如果已配置）
npm run upload-avatars
```

### 步骤 2：验证上传

脚本会输出以下信息：

```
🎨 开始处理用户头像...

📸 处理: pexels-116281951-12089085.jpg
  ✓ 转换完成: mia.webp (200x200)
  ✓ 上传到 R2: ui/avatars/mia.webp

📸 处理: pexels-max-medyk-3108397-23885853.jpg
  ✓ 转换完成: leo.webp (200x200)
  ✓ 上传到 R2: ui/avatars/leo.webp

...

✨ 处理完成！
📊 统计:
  - 成功: 4 个
  - 失败: 0 个

✅ 所有头像已成功上传到 R2！
```

### 步骤 3：更新 `lib/image-urls.ts`

将头像列表从 JPG 更新为 WebP：

**之前：**
```typescript
export const AvatarImages = {
  get: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("avatars", filename, source),

  // 预定义头像列表
  list: ["mia.jpg", "leo.jpg", "ava.jpg", "ken.jpg"],

  // 获取所有头像URLs
  getAll: (source?: ImageSource | "auto") =>
    AvatarImages.list.map((filename) => AvatarImages.get(filename, source)),
};
```

**之后：**
```typescript
export const AvatarImages = {
  get: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("avatars", filename, source),

  // 预定义头像列表
  list: ["mia.webp", "leo.webp", "ava.webp", "ken.webp"],

  // 获取所有头像URLs
  getAll: (source?: ImageSource | "auto") =>
    AvatarImages.list.map((filename) => AvatarImages.get(filename, source)),
};
```

### 步骤 4：更新 `lib/data.ts`

将头像引用从 JPG 更新为 WebP：

**之前：**
```typescript
export const testimonials = [
  {
    name: "Mia",
    age: 27,
    location: "London",
    platform: "Tinder",
    rating: 5,
    text: "Uploaded one photo at lunch—had a new profile by evening.",
    avatar: AvatarImages.get("mia.jpg"),
    date: "2025/08",
  },
  // ... 其他用户
];
```

**之后：**
```typescript
export const testimonials = [
  {
    name: "Mia",
    age: 27,
    location: "London",
    platform: "Tinder",
    rating: 5,
    text: "Uploaded one photo at lunch—had a new profile by evening.",
    avatar: AvatarImages.get("mia.webp"),
    date: "2025/08",
  },
  // ... 其他用户
];
```

## 脚本功能

### `scripts/process-avatars.js`

**功能：**
1. ✅ 读取 `public/images/` 中的 JPG 文件
2. ✅ 转换为 WebP 格式（200x200 圆形头像）
3. ✅ 上传到 R2（`ui/avatars/` 目录）
4. ✅ 清理临时文件
5. ✅ 输出上传统计和更新指南

**处理细节：**
- 图片大小：200x200 像素（适合圆形头像）
- 格式：WebP（质量 85%）
- 缓存：1 年（`max-age=31536000`）
- 位置：R2 的 `ui/avatars/` 目录

## R2 URL 格式

上传后，头像 URL 格式为：

```
https://rizzify.org/ui/avatars/mia.webp
https://rizzify.org/ui/avatars/leo.webp
https://rizzify.org/ui/avatars/ava.webp
https://rizzify.org/ui/avatars/ken.webp
```

（具体域名取决于 `NEXT_PUBLIC_CLOUDFLARE_R2_STATIC_DOMAIN` 环境变量）

## 故障排除

### 错误：缺少 R2 环境变量

**解决方案：**
```bash
# 检查 .env 文件是否包含以下变量
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
```

### 错误：文件不存在

**解决方案：**
确保源文件存在于 `public/images/` 目录：
```bash
ls -la public/images/pexels-*.jpg
```

### 错误：上传失败

**解决方案：**
1. 检查 R2 凭证是否正确
2. 检查网络连接
3. 检查 R2 存储桶权限

## 验证上传

### 方法 1：检查 R2 控制面板

1. 登录 Cloudflare 仪表板
2. 进入 R2 存储
3. 查看 `rizzify` 存储桶
4. 导航到 `ui/avatars/` 目录
5. 验证 4 个 WebP 文件是否存在

### 方法 2：测试 URL

在浏览器中访问：
```
https://rizzify.org/ui/avatars/mia.webp
https://rizzify.org/ui/avatars/leo.webp
https://rizzify.org/ui/avatars/ava.webp
https://rizzify.org/ui/avatars/ken.webp
```

## 性能优化

### WebP 优势

- **文件大小**：比 JPG 小 25-35%
- **质量**：相同质量下文件更小
- **浏览器支持**：现代浏览器都支持（95%+ 覆盖）

### 缓存策略

- **缓存时间**：1 年（`max-age=31536000`）
- **CDN**：Cloudflare 自动缓存
- **结果**：首次加载后极快

## 后续步骤

1. ✅ 运行脚本上传头像
2. ✅ 更新 `lib/image-urls.ts`
3. ✅ 更新 `lib/data.ts`
4. ✅ 测试推荐卡片显示
5. ✅ 验证移动端显示

## 相关文件

- `scripts/process-avatars.js` - 转换和上传脚本
- `lib/image-urls.ts` - 图片 URL 管理
- `lib/data.ts` - 推荐数据
- `components/Testimonials.tsx` - 推荐卡片组件

---

**最后更新**：2025-10-24
**版本**：1.0
