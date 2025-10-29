# Cloudflare R2 图片存储配置指南

## 概述

本项目使用 Cloudflare R2 作为图片存储解决方案，提供高性能、低成本的全球CDN服务。

## 环境变量配置

在 `.env.local` 文件中添加以下配置：

```env
# === R2 基础配置 ===
CLOUDFLARE_R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key

# === R2 存储桶配置 ===
CLOUDFLARE_R2_STATIC_BUCKET=rizzify-static
CLOUDFLARE_R2_TEMPLATES_BUCKET=rizzify-templates
CLOUDFLARE_R2_USER_DATA_BUCKET=rizzify-user-data

# === R2 CDN域名配置 ===
CLOUDFLARE_R2_STATIC_DOMAIN=https://static.rizzify.com
CLOUDFLARE_R2_USER_DATA_DOMAIN=https://cdn.rizzify.com

# === 图片源切换 ===
USE_R2_IMAGES=false  # 开发环境设为 false，生产环境设为 true
```

## R2 存储桶结构

### 1. rizzify-static (静态UI资源)
```
rizzify-static/
├── ui/
│   ├── login/           # 登录背景图片 (34个WebP)
│   ├── gallery/         # 主页滚动画廊 (24个WebP)
│   ├── before-after/    # Before/After对比图
│   │   ├── before/      # 对比前图片
│   │   └── after/       # 对比后图片
│   ├── examples/        # 理想上传示例 (8个)
│   ├── avoid/           # 应避免示例 (4个)
│   └── avatars/         # 用户头像 (4个)
```

### 2. rizzify-templates (AI模板)
```
rizzify-templates/
├── styles/
│   ├── male/            # 男性风格模板
│   ├── female/          # 女性风格模板
│   └── shared/          # 通用模板
```

### 3. rizzify-user-data (用户数据)
```
rizzify-user-data/
├── uploads/
│   └── {userId}/        # 用户上传的原始图片
├── generated/
│   └── {taskId}/        # AI生成的图片
└── profiles/
    └── {userId}/        # 用户资料图片
```

## 设置步骤

### 1. 创建 Cloudflare R2 存储桶

```bash
# 使用 Wrangler CLI 创建存储桶
wrangler r2 bucket create rizzify-static
wrangler r2 bucket create rizzify-templates  
wrangler r2 bucket create rizzify-user-data
```

### 2. 配置自定义域名

在 Cloudflare 控制台中：

1. 进入 R2 → 存储桶设置
2. 添加自定义域名：
   - `static.rizzify.com` → `rizzify-static`
   - `cdn.rizzify.com` → `rizzify-user-data`
3. 配置缓存规则和安全策略

### 3. 生成 API 密钥

1. 进入 Cloudflare 控制台 → API Tokens
2. 创建自定义令牌，权限：
   - `Zone:Zone:Read`
   - `Zone:Zone Settings:Edit`
   - `Account:Cloudflare R2:Edit`

### 4. 运行图片迁移脚本

```bash
# 设置环境变量后运行迁移
npm run migrate-images

# 或者手动运行
node scripts/migrate-images-to-r2.js
```

## 使用方法

### 开发环境

```typescript
// 使用本地图片
import { LoginImages } from '@/lib/image-urls';

// 自动根据环境变量选择源
const imageUrl = LoginImages.get('some-image.webp'); // → /images/login/some-image.webp

// 强制使用本地图片
const localUrl = LoginImages.get('some-image.webp', 'local');
```

### 生产环境

```typescript
// 使用R2图片
const imageUrl = LoginImages.get('some-image.webp'); // → https://static.rizzify.com/ui/login/some-image.webp

// 强制使用R2图片
const r2Url = LoginImages.get('some-image.webp', 'r2');
```

### 图片URL获取示例

```typescript
import { 
  LoginImages, 
  BeforeAfterImages, 
  ExampleImages, 
  AvoidImages 
} from '@/lib/image-urls';

// 登录背景图片
const loginBg = LoginImages.get('04cd87b5-3984-474e-b5fc-bf887b582e79.webp');

// 对比图片
const beforeImg = BeforeAfterImages.getBefore('before-1.webp');
const afterImg = BeforeAfterImages.getAfter('after-1.webp');

// 示例图片
const idealExamples = ExampleImages.getIdealExamples();
const avoidExamples = AvoidImages.getAvoidExamples();
```

## Next.js 配置

在 `next.config.js` 中添加R2域名：

```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.rizzify.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.rizzify.com',
      }
    ],
  },
}
```

## 迁移策略

### 阶段1: 准备阶段
- [x] 创建R2存储桶
- [x] 配置环境变量
- [x] 编写迁移脚本
- [x] 创建图片URL管理系统

### 阶段2: 渐进迁移
- [ ] 上传静态图片到R2
- [ ] 测试图片加载
- [ ] 逐步更新组件引用
- [ ] 性能对比测试

### 阶段3: 完全切换
- [ ] 生产环境启用R2图片
- [ ] 监控性能指标
- [ ] 删除本地图片文件
- [ ] 清理旧代码

## 成本估算

### 存储费用
- 静态图片: ~500MB × $0.015/GB/月 = $0.008/月
- 用户数据: ~10GB × $0.015/GB/月 = $0.15/月

### 流量费用
- 静态资源: ~50GB/月 × $0.36/TB = $0.018/月
- 用户内容: ~20GB/月 × $0.36/TB = $0.007/月

**总计: ~$0.18/月**

## 性能优化

### 缓存策略
```javascript
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable', // 1年缓存
  'CDN-Cache-Control': 'max-age=31536000',
};
```

### 图片优化
- WebP格式，85%质量
- 多尺寸响应式图片
- 懒加载和预加载

### 监控指标
- 图片加载时间
- CDN命中率
- 用户体验指标

## 故障排除

### 常见问题

1. **图片加载失败**
   - 检查CORS配置
   - 验证域名解析
   - 确认存储桶权限

2. **环境变量未生效**
   - 重启开发服务器
   - 检查.env.local文件
   - 验证变量名拼写

3. **迁移脚本失败**
   - 检查R2连接
   - 验证API权限
   - 查看错误日志

### 调试命令

```bash
# 测试R2连接
node -e "console.log(require('./lib/image-urls').getImageSourceInfo())"

# 检查图片URL生成
node -e "console.log(require('./lib/image-urls').LoginImages.get('test.webp'))"
```

## 参考链接

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Wrangler CLI 指南](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js 图片优化](https://nextjs.org/docs/basic-features/image-optimization)