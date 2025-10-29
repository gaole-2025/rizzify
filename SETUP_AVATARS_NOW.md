# 🚀 立即设置用户头像

## ⚡ 一键执行

在项目根目录打开终端，运行以下命令：

```bash
npm run avatars:setup
```

**就这么简单！** ✨

---

## 📊 脚本会做什么

1. ✅ 检查 `public/images/` 中的 4 个 JPG 文件
2. ✅ 转换为 WebP 格式（200x200 像素）
3. ✅ 保存到 `public/avatars/` 目录
4. ✅ 验证配置文件已更新

---

## 📁 输出文件

脚本完成后，您会在 `public/avatars/` 目录中看到：

```
public/avatars/
├── mia.webp      (Mia, 27, London)
├── leo.webp      (Leo, 29, Berlin)
├── ava.webp      (Ava, 26, New York)
└── ken.webp      (Ken, 31, Singapore)
```

---

## 🧪 测试显示

脚本完成后，运行：

```bash
npm run dev
```

然后访问 `http://localhost:3000`，滚动到推荐卡片部分，验证头像显示。

---

## 📱 验证移动端

1. 打开浏览器开发者工具（F12）
2. 切换到移动端视图（Ctrl+Shift+M）
3. 验证头像在移动端正常显示

---

## 🔄 其他命令

### 仅转换（不保存到本地）
```bash
npm run avatars:convert
```

### 上传到 R2（需要配置环境变量）
```bash
npm run avatars:upload
```

---

## ❌ 如果出错

### 错误：缺少 sharp 依赖

```bash
npm install sharp
```

### 错误：文件不存在

检查源文件：
```bash
ls -la public/images/pexels-*.jpg
```

### 错误：权限不足

在 Windows 上，以管理员身份运行终端。

---

## ✅ 完成！

所有步骤完成后，推荐卡片将显示用户头像。

**最后更新**：2025-10-24
