/**
 * Creem Webhook 处理
 * POST /api/creem/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCreemWebhookSignature, CreemWebhookEvent } from '@/src/lib/creem-webhook-verify';
import { db } from '@/src/db/client';

export const runtime = 'nodejs';

async function buffer(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. 获取原始请求体（用于签名验证）
    const rawBody = await buffer(request as any);
    const signature = request.headers.get('creem-signature');

    if (!signature) {
      console.error('❌ Missing creem-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 2. 验证签名
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ CREEM_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const isValid = verifyCreemWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('❌ Invalid Creem webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. 解析事件
    const event: CreemWebhookEvent = JSON.parse(rawBody.toString());
    console.log(`📨 Creem webhook received: ${event.eventType}`);

    // 4. 处理事件
    switch (event.eventType) {
      case 'checkout.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'order.completed':
        await handleOrderCompleted(event);
        break;

      case 'checkout.expired':
        await handleCheckoutExpired(event);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.eventType}`);
    }

    // 5. 返回成功响应
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 处理 checkout.completed 事件
 * 用户完成支付，Creem 返回订单信息
 */
async function handleCheckoutCompleted(event: CreemWebhookEvent) {
  const { request_id, order_id, checkout_id, product_id, status } = event.object;

  console.log(`✅ Checkout completed: request_id=${request_id}, order_id=${order_id}`);

  // 1. 查找对应的 Payment 记录
  const payment = await db.payment.findFirst({
    where: { requestId: request_id },
    include: { user: true },
  });

  if (!payment) {
    console.error(`❌ Payment not found for request_id: ${request_id}`);
    return;
  }

  // 2. 更新 Payment 状态为 succeeded
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'succeeded',
      providerRef: order_id,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Payment ${payment.id} marked as succeeded`);

  // 3. 用户权限开通逻辑
  // 这里可以根据 payment.plan 给用户增加额度
  // 例如：更新 DailyQuota、标记用户为 VIP 等
  console.log(`🎉 User ${payment.user.email} purchased plan: ${payment.plan}`);
}

/**
 * 处理 order.completed 事件
 * 订单完全完成（可选，checkout.completed 通常已足够）
 */
async function handleOrderCompleted(event: CreemWebhookEvent) {
  const { request_id, order_id } = event.object;

  console.log(`✅ Order completed: request_id=${request_id}, order_id=${order_id}`);

  // 可以在这里做额外的处理，比如发送邮件确认等
}

/**
 * 处理 checkout.expired 事件
 * 支付会话过期
 */
async function handleCheckoutExpired(event: CreemWebhookEvent) {
  const { request_id, checkout_id } = event.object;

  console.log(`⏰ Checkout expired: request_id=${request_id}, checkout_id=${checkout_id}`);

  // 1. 查找对应的 Payment 记录
  const payment = await db.payment.findFirst({
    where: { requestId: request_id },
  });

  if (!payment) {
    console.error(`❌ Payment not found for request_id: ${request_id}`);
    return;
  }

  // 2. 更新 Payment 状态为 failed
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'failed',
      updatedAt: new Date(),
    },
  });

  console.log(`❌ Payment ${payment.id} marked as failed (checkout expired)`);
}
