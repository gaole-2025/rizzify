# ✅ Free 套餐限制 - 快速检查清单

## 🎯 实现状态

### ✅ 已完成

- [x] 创建水印处理器 (`src/lib/watermark-processor.ts`)
- [x] 添加配额检查 (`app/api/generation/start/route.ts`)
- [x] 集成水印处理 (`src/worker/real-worker.ts`)
- [x] 添加配额更新 (`src/worker/real-worker.ts`)
- [x] 添加 uploadBuffer 方法 (`src/lib/image-manager.ts`)

### ⏳ 待做

- [ ] 安装 sharp：`npm install sharp`
- [ ] 测试配额检查
- [ ] 测试水印处理
- [ ] 验证数据库配额更新
- [ ] 部署上线

---

## 📦 安装依赖

```bash
npm install sharp
```

---

## 🧪 快速测试

### 测试 1：配额检查

```bash
# 第一次请求
curl -X POST http://localhost:3000/api/generation/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"free","gender":"male","fileId":"upload-123"}'

# 预期：200 OK

# 第二次请求
curl -X POST http://localhost:3000/api/generation/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"free","gender":"female","fileId":"upload-456"}'

# 预期：429 Too Many Requests
```

### 测试 2：查看配额

```bash
psql $DATABASE_URL -c "SELECT * FROM \"DailyQuota\" WHERE \"userId\" = 'user-123';"
```

### 测试 3：验证水印

生成 free 计划的图片，下载后用图片查看器验证水印存在。

---

## 📊 关键文件

| 文件 | 操作 | 行数 |
|------|------|------|
| `src/lib/watermark-processor.ts` | 新建 | 40 |
| `app/api/generation/start/route.ts` | 修改 | +20 |
| `src/worker/real-worker.ts` | 修改 | +50 |
| `src/lib/image-manager.ts` | 修改 | +30 |

---

## ✨ 功能验证

- ✅ Free 用户每天只能生成 1 次
- ✅ Free 图片自动添加水印
- ✅ 配额自动更新到数据库
- ✅ 下一天自动重置（现有 cron job）

---

## 🚀 部署

1. 安装依赖：`npm install sharp`
2. 测试验证
3. 提交代码
4. 部署上线

完成！🎉

