# Creem 支付集成指南

## 📋 概述

本文档说明如何在 Rizzify 中集成 Creem 支付平台。

**集成模式**：一次性购买（非订阅）
- **Start 计划**：$9.99 / 次
- **Pro 计划**：$19.99 / 次
- **Free 计划**：无需支付

## 🔧 已完成的实现

### 1. 数据库扩展
- ✅ `Payment` 表新增 3 个字段：
  - `creemCheckoutId`：支付会话 ID
  - `creemProductId`：产品 ID
  - `requestId`：订单追踪 ID

### 2. 后端 API
- ✅ `/api/creem/checkout` - 创建支付会话
- ✅ `/api/creem/webhook` - 处理 Webhook

### 3. 前端页面
- ✅ `/payment/success` - 支付成功页面
- ✅ `/payment/cancel` - 支付取消页面
- ✅ `src/lib/creem-checkout.ts` - 前端集成工具

### 4. 工具库
- ✅ `src/lib/creem-client.ts` - Creem API 客户端
- ✅ `src/lib/creem-webhook-verify.ts` - Webhook 签名验证

## 🚀 快速开始

### 步骤 1：运行数据库迁移

```bash
npx prisma migrate dev --name add_creem_payment_fields
```

### 步骤 2：配置环境变量

在 `.env` 中已配置：
```env
CREEM_API_KEY=creem_test_4Vy3Xo8Im8cQwxX8P6c97e
CREEM_WEBHOOK_SECRET=whsec_********  # 稍后从 Creem Dashboard 获取
CREEM_PRODUCT_START_ID=prod_3pLtzOT72nNbemyqvtd7va
CREEM_PRODUCT_PRO_ID=prod_3M7b6FqtdoMsyJQcBoDndI
```

### 步骤 3：在生成页面添加升级按钮

在 `/app/(flow)/gen-image/page.tsx` 中添加：

```tsx
import { initiateCreemCheckout } from '@/src/lib/creem-checkout';

// 在组件中添加升级按钮
<button
  onClick={() => initiateCreemCheckout('start')}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
>
  Upgrade to Start Plan
</button>

<button
  onClick={() => initiateCreemCheckout('pro')}
  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
>
  Upgrade to Pro Plan
</button>
```

### 步骤 4：配置 Creem Webhook

1. 登录 [Creem Dashboard](https://dashboard.creem.io)
2. 进入 **Developers → Webhooks**
3. 添加 Webhook URL：
   - **测试环境**：`https://your-domain.com/api/creem/webhook`
   - **正式环境**：`https://www.rizzify.org/api/creem/webhook`
4. 选择事件：
   - `checkout.completed`
   - `checkout.expired`
5. 复制 **Webhook Secret** 到 `.env` 的 `CREEM_WEBHOOK_SECRET`

### 步骤 5：测试支付流程

1. 在生成页面点击"升级"按钮
2. 跳转到 Creem 收银台
3. 使用测试卡号支付（Creem 提供测试卡）
4. 支付成功后跳转回 `/payment/success`
5. 检查 Webhook 是否正确处理（查看后端日志）

## 📊 工作流程

```
用户点击"升级到 Pro"
    ↓
前端调用 initiateCreemCheckout('pro')
    ↓
POST /api/creem/checkout
    ↓
后端创建 Payment 记录（status: pending）
    ↓
调用 Creem API 创建 Checkout Session
    ↓
返回 checkout_url
    ↓
前端跳转到 Creem 收银台
    ↓
用户支付
    ↓
Creem 发送 Webhook（checkout.completed）
    ↓
POST /api/creem/webhook
    ↓
验证签名 → 更新 Payment 状态为 succeeded
    ↓
用户获得额度（可在此处添加业务逻辑）
    ↓
用户被重定向回 /payment/success
```

## 🔐 安全性

### Webhook 签名验证
- ✅ 使用 HMAC-SHA256 验证签名
- ✅ 防止时序攻击（timingSafeEqual）
- ✅ 验证失败返回 401

### API Key 安全
- ✅ 仅在后端使用 `CREEM_API_KEY`
- ✅ 前端永远不暴露 API Key
- ✅ 使用环境变量管理敏感信息

## 📝 数据库设计

### Payment 表扩展

```prisma
model Payment {
  id              String    @id @default(uuid())
  userId          String
  plan            Plan      // free | start | pro
  amountUsd       Decimal   @db.Decimal(10, 2)
  provider        String    // "creem"
  status          PayStatus // pending | succeeded | failed | refunded
  providerRef     String?   // creem_order_id
  
  // Creem 专用字段
  creemCheckoutId String?   // checkout_id
  creemProductId  String?   // prod_xxx
  requestId       String?   // 自己的订单追踪 ID
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([status])
  @@index([creemCheckoutId])
}
```

## 🧪 测试清单

- [ ] 数据库迁移成功
- [ ] 环境变量配置正确
- [ ] 前端升级按钮可点击
- [ ] 能跳转到 Creem 收银台
- [ ] 支付成功后回跳到 `/payment/success`
- [ ] Webhook 正确处理支付完成事件
- [ ] Payment 记录状态更新为 `succeeded`
- [ ] 用户权限正确开通

## 🔗 相关文档

- [Creem API 文档](https://docs.creem.io)
- [Creem Webhook 文档](https://docs.creem.io/webhooks)
- [Creem 测试卡号](https://docs.creem.io/testing)

## 📞 故障排查

### 问题：Webhook 签名验证失败
**原因**：Webhook Secret 不匹配或请求体被修改
**解决**：
1. 确认 `CREEM_WEBHOOK_SECRET` 正确
2. 检查是否使用了原始请求体（不能 JSON parse 后再 stringify）

### 问题：支付后用户权限未开通
**原因**：Webhook 未正确处理或业务逻辑缺失
**解决**：
1. 检查后端日志中 Webhook 是否被接收
2. 在 `handleCheckoutCompleted` 中添加权限开通逻辑

### 问题：Payment 记录未创建
**原因**：数据库连接问题或迁移未执行
**解决**：
1. 运行 `npx prisma migrate dev`
2. 检查数据库连接字符串

## 🎯 后续优化

- [ ] 添加邮件确认（支付成功后发送邮件）
- [ ] 添加退款处理（监听 `refund.created` 事件）
- [ ] 添加订阅管理（如需要）
- [ ] 集成分析（追踪转化率、平均订单价值等）
- [ ] 本地化支持（多语言、多货币）
