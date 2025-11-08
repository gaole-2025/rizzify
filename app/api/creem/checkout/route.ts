/**
 * Creem 支付会话创建 API
 * POST /api/creem/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCreemClient } from '@/src/lib/creem-client';
import { authenticateUser, createAuthErrorResponse } from '@/src/lib/auth-helpers';
import { db } from '@/src/db/client';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// Creem 产品 ID 映射
const CREEM_PRODUCTS = {
  start: process.env.CREEM_PRODUCT_START_ID || 'prod_3pLtzOT72nNbemyqvtd7va',
  pro: process.env.CREEM_PRODUCT_PRO_ID || 'prod_3M7b6FqtdoMsyJQcBoDndI',
};

// 产品价格（美元）
const PRODUCT_PRICES: Record<string, number> = {
  start: 9.99,
  pro: 19.99,
};

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode);
    }

    const user = authResult.user!;

    // 2. 解析请求体
    const body = await request.json();
    const { plan, uploadId, gender } = body;

    // 3. 验证计划
    if (!plan || !['start', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "start" or "pro"' },
        { status: 400 }
      );
    }

    // 4. 验证生成所需的参数
    if (!uploadId || !gender) {
      return NextResponse.json(
        { error: 'Missing required parameters: uploadId, gender' },
        { status: 400 }
      );
    }

    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be "male" or "female"' },
        { status: 400 }
      );
    }

    // 4. 生成订单追踪 ID
    const requestId = `user_${user.id}_${Date.now()}_${uuidv4().slice(0, 8)}`;

    // 5. 创建 Payment 记录（初始状态为 pending）
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        plan: plan as any,
        amountUsd: PRODUCT_PRICES[plan],
        provider: 'creem',
        status: 'pending',
        creemProductId: CREEM_PRODUCTS[plan as keyof typeof CREEM_PRODUCTS],
        requestId,
        uploadId,
        gender,
      },
    });

    console.log(`📋 Payment record created: ${payment.id} for user ${user.email}`);

    // 6. 调用 Creem API 创建 Checkout
    const creemClient = getCreemClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rizzify.org';

    const checkoutPayload = {
      product_id: CREEM_PRODUCTS[plan as keyof typeof CREEM_PRODUCTS],
      request_id: requestId,
      success_url: `${baseUrl}/payment/success`,
      cancel_url: `${baseUrl}/payment/cancel`,
      customer: {
        email: user.email,
      },
      metadata: {
        userId: user.id,
        plan,
        paymentId: payment.id,
      },
    };

    const checkout = await creemClient.createCheckout(checkoutPayload);

    // 7. 更新 Payment 记录，保存 checkout_id
    await db.payment.update({
      where: { id: payment.id },
      data: {
        creemCheckoutId: checkout.checkout_id,
      },
    });

    console.log(`✅ Checkout created: ${checkout.checkout_id}`);

    // 8. 返回 checkout URL
    return NextResponse.json({
      checkoutUrl: checkout.checkout_url,
      checkoutId: checkout.checkout_id,
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error('❌ Creem checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
