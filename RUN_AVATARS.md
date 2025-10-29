# 🚀 运行用户头像上传脚本

## 📋 前置条件

1. ✅ Node.js 已安装
2. ✅ 依赖已安装：`npm install`
3. ✅ 环境变量已配置（`.env` 或 `.env.local`）

## 🔧 环境变量配置

在项目根目录创建或编辑 `.env.local` 文件，添加以下内容：

```bash
# Cloudflare R2 配置
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=rizzify
```

## ▶️ 运行脚本

### 方法 1：使用 Windows 批处理（推荐）

**双击运行：**
```
run-avatar-upload.bat
```

或在 PowerShell 中运行：
```powershell
.\run-avatar-upload.bat
```

### 方法 2：使用 PowerShell 脚本

```powershell
# 允许执行脚本
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 运行脚本
.\run-avatar-upload.ps1
```

### 方法 3：直接使用 Node.js

```bash
# 在项目根目录打开终端，运行：
node scripts/process-avatars.js
```

## 📊 预期输出

```
🎨 开始处理用户头像...

📸 处理: pexels-116281951-12089085.jpg
  ✓ 转换完成: mia.webp (200x200)
  ✓ 上传到 R2: ui/avatars/mia.webp

📸 处理: pexels-max-medyk-3108397-23885853.jpg
  ✓ 转换完成: leo.webp (200x200)
  ✓ 上传到 R2: ui/avatars/leo.webp

📸 处理: pexels-saulo-leite-1491182-19719795.jpg
  ✓ 转换完成: ava.webp (200x200)
  ✓ 上传到 R2: ui/avatars/ava.webp

📸 处理: pexels-trace-2834009.jpg
  ✓ 转换完成: ken.webp (200x200)
  ✓ 上传到 R2: ui/avatars/ken.webp

✨ 处理完成！
📊 统计:
  - 成功: 4 个
  - 失败: 0 个

✅ 所有头像已成功上传到 R2！
```

## ✅ 验证上传

### 方法 1：检查 R2 控制面板

1. 登录 Cloudflare 仪表板
2. 进入 R2 存储
3. 查看 `rizzify` 存储桶
4. 导航到 `ui/avatars/` 目录
5. 验证 4 个 WebP 文件存在

### 方法 2：测试 URL

在浏览器中访问（替换为您的 R2 域名）：
```
https://rizzify.org/ui/avatars/mia.webp
https://rizzify.org/ui/avatars/leo.webp
https://rizzify.org/ui/avatars/ava.webp
https://rizzify.org/ui/avatars/ken.webp
```

## 🧪 测试推荐卡片

1. 启动开发服务器
```bash
npm run dev
```

2. 打开浏览器访问 `http://localhost:3000`

3. 滚动到 "What changed after switching to Rizzify" 部分

4. 验证 4 个用户头像显示正确

## 📱 验证移动端

1. 打开浏览器开发者工具（F12）
2. 切换到移动端视图（Ctrl+Shift+M）
3. 验证头像在移动端正常显示
4. 检查图片加载速度

## ❌ 故障排除

### 错误：缺少环境变量

**解决方案：**
- 检查 `.env.local` 文件是否存在
- 确保包含所有必要的 R2 环境变量
- 重启开发服务器

### 错误：缺少依赖

**解决方案：**
```bash
npm install sharp @aws-sdk/client-s3
```

### 错误：文件不存在

**解决方案：**
```bash
# 检查源文件
ls -la public/images/pexels-*.jpg
```

### 错误：上传失败

**解决方案：**
1. 检查网络连接
2. 验证 R2 凭证
3. 检查 R2 存储桶权限

## 📝 相关文件

| 文件 | 说明 |
|------|------|
| `scripts/process-avatars.js` | 转换和上传脚本 |
| `run-avatar-upload.bat` | Windows 批处理脚本 |
| `run-avatar-upload.ps1` | PowerShell 脚本 |
| `AVATAR_UPLOAD_GUIDE.md` | 详细指南 |
| `QUICK_START_AVATARS.md` | 快速开始指南 |
| `lib/image-urls.ts` | 图片 URL 管理（已更新） |
| `lib/data.ts` | 推荐数据（已更新） |

## 🎉 完成！

所有步骤完成后，推荐卡片将显示用户头像。

---

**最后更新**：2025-10-24
