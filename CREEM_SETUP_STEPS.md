# Creem 集成 - 本地设置步骤

## ✅ 已完成的工作

我已经为你生成了完整的 Creem 支付集成代码：

### 📁 新增文件

```
/app/api/creem/checkout/route.ts          # 创建支付会话 API
/app/api/creem/webhook/route.ts           # Webhook 处理 API
/app/payment/success/page.tsx             # 支付成功页面
/app/payment/cancel/page.tsx              # 支付取消页面
/src/lib/creem-client.ts                  # Creem API 客户端
/src/lib/creem-checkout.ts                # 前端集成工具
/src/lib/creem-webhook-verify.ts          # Webhook 签名验证
/docs/CREEM_INTEGRATION.md                # 完整集成文档
```

### 📝 修改的文件

```
/prisma/schema.prisma                     # Payment 表新增 3 个字段
/.env                                     # 添加 Creem 配置
```

---

## 🚀 本地测试步骤

### 1️⃣ 运行数据库迁移

```bash
npx prisma migrate dev --name add_creem_payment_fields
```

**预期输出**：
```
✓ Created migration: 20250109_add_creem_payment_fields
✓ Applied migration: 20250109_add_creem_payment_fields
```

### 2️⃣ 验证环境变量

检查 `.env` 中是否有：
```env
CREEM_API_KEY=creem_test_4Vy3Xo8Im8cQwxX8P6c97e
CREEM_WEBHOOK_SECRET=whsec_********
CREEM_PRODUCT_START_ID=prod_3pLtzOT72nNbemyqvtd7va
CREEM_PRODUCT_PRO_ID=prod_3M7b6FqtdoMsyJQcBoDndI
NEXT_PUBLIC_BASE_URL=https://www.rizzify.org
```

### 3️⃣ 启动开发服务器

```bash
npm run dev
```

### 4️⃣ 测试支付流程

#### 4.1 创建支付会话（测试 API）

```bash
curl -X POST http://localhost:3000/api/creem/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"plan":"start"}'
```

**预期响应**：
```json
{
  "checkoutUrl": "https://checkout.creem.io/...",
  "checkoutId": "chk_xxx",
  "paymentId": "payment_id_xxx"
}
```

#### 4.2 手动测试 Webhook（可选）

使用 Postman 或 curl 模拟 Webhook：

```bash
# 1. 生成签名
BODY='{"eventType":"checkout.completed","timestamp":"2025-01-09T...","object":{"request_id":"user_xxx_...","order_id":"order_xxx"}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "whsec_..." -hex | cut -d' ' -f2)

# 2. 发送 Webhook
curl -X POST http://localhost:3000/api/creem/webhook \
  -H "Content-Type: application/json" \
  -H "creem-signature: $SIGNATURE" \
  -d "$BODY"
```

---

## 🔧 在生成页面添加升级按钮

编辑 `/app/(flow)/gen-image/page.tsx`，在适当位置添加：

```tsx
import { initiateCreemCheckout } from '@/src/lib/creem-checkout';

// 在组件中添加按钮
<div className="space-y-2">
  <button
    onClick={() => initiateCreemCheckout('start')}
    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
  >
    💳 Upgrade to Start Plan ($9.99)
  </button>
  <button
    onClick={() => initiateCreemCheckout('pro')}
    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
  >
    💳 Upgrade to Pro Plan ($19.99)
  </button>
</div>
```

---

## 🌐 配置 Creem Webhook（生产环境）

### 步骤 1：登录 Creem Dashboard

访问 [https://dashboard.creem.io](https://dashboard.creem.io)

### 步骤 2：进入 Webhooks 配置

导航：**Developers → Webhooks**

### 步骤 3：添加 Webhook

- **URL**：`https://www.rizzify.org/api/creem/webhook`
- **事件**：选择以下事件
  - `checkout.completed`
  - `checkout.expired`
  - `order.completed`（可选）

### 步骤 4：获取 Webhook Secret

创建 Webhook 后，Creem 会显示 **Webhook Secret**（格式：`whsec_...`）

### 步骤 5：更新环境变量

将 Webhook Secret 添加到 `.env`：
```env
CREEM_WEBHOOK_SECRET=whsec_你的secret
```

然后重启开发服务器。

---

## 📊 测试支付流程（完整）

### 使用 Creem 测试卡

Creem 提供测试卡号用于开发：

| 卡号 | 有效期 | CVC | 结果 |
|------|--------|-----|------|
| 4242 4242 4242 4242 | 12/25 | 123 | ✅ 成功 |
| 4000 0000 0000 0002 | 12/25 | 123 | ❌ 失败 |

### 完整流程

1. 访问 `http://localhost:3000/gen-image`
2. 点击"Upgrade to Start Plan"按钮
3. 跳转到 Creem 收银台
4. 输入测试卡号 `4242 4242 4242 4242`
5. 支付成功后跳转回 `/payment/success`
6. 检查后端日志中 Webhook 是否被处理
7. 查询数据库验证 Payment 记录状态是否为 `succeeded`

---

## 🐛 调试技巧

### 查看 API 日志

后端会输出详细日志：
```
✅ Creem checkout created: chk_xxx
📋 Payment record created: payment_id_xxx
📨 Creem webhook received: checkout.completed
✅ Payment payment_id_xxx marked as succeeded
```

### 检查数据库

```sql
SELECT id, userId, plan, status, creemCheckoutId, requestId, createdAt 
FROM "Payment" 
WHERE provider = 'creem' 
ORDER BY createdAt DESC 
LIMIT 10;
```

### 验证签名

如果 Webhook 签名验证失败，检查：
1. `CREEM_WEBHOOK_SECRET` 是否正确
2. 是否使用了原始请求体（不能 JSON parse 后再 stringify）

---

## ✅ 完整检查清单

- [ ] 数据库迁移成功（`npx prisma migrate dev`）
- [ ] `.env` 中配置了所有 Creem 变量
- [ ] 前端升级按钮已添加到生成页面
- [ ] 能成功跳转到 Creem 收银台
- [ ] 支付成功后回跳到 `/payment/success`
- [ ] 后端日志显示 Webhook 已处理
- [ ] 数据库中 Payment 记录状态为 `succeeded`
- [ ] 用户权限已正确开通（如需要，在 webhook 处理中添加业务逻辑）

---

## 📞 常见问题

### Q: 为什么 Webhook 没有被触发？
**A**: 
1. 确认 Webhook URL 在 Creem Dashboard 中正确配置
2. 确认 Webhook Secret 正确
3. 检查防火墙是否允许 Creem 服务器的入站请求

### Q: 支付后用户权限未开通？
**A**: 在 `/app/api/creem/webhook/route.ts` 的 `handleCheckoutCompleted` 函数中添加业务逻辑，例如：
```typescript
// 增加用户额度
await db.dailyQuota.upsert({
  where: { userId_dayUtc: { userId: payment.userId, dayUtc: today } },
  create: { userId: payment.userId, dayUtc: today, usedCount: 0 },
  update: { usedCount: { increment: 0 } }, // 或其他逻辑
});
```

### Q: 如何切换到正式环境？
**A**:
1. 在 Creem Dashboard 中切换到 Live Mode
2. 获取正式环境的 API Key 和产品 ID
3. 更新 `.env` 中的 `CREEM_API_KEY` 和产品 ID
4. 更新 Webhook URL 为正式域名

---

## 🎯 下一步

1. ✅ 本地测试支付流程
2. ✅ 配置 Creem Webhook
3. ✅ 部署到 Vercel
4. ✅ 在生产环境测试
5. ⏳ 监控支付转化率和错误日志

---

**需要帮助？** 查看 `/docs/CREEM_INTEGRATION.md` 获取更详细的文档。
