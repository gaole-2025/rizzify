/**
 * Creem Webhook 签名验证
 * 使用 HMAC-SHA256 验证 Creem 发送的 Webhook
 */

import crypto from 'crypto';

/**
 * 验证 Creem Webhook 签名
 * @param rawBody 原始请求体（Buffer 或 string）
 * @param signature 请求头中的 creem-signature
 * @param webhookSecret Webhook Secret（来自 Creem Dashboard）
 * @returns 签名是否有效
 */
export function verifyCreemWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
  webhookSecret: string
): boolean {
  const body = typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  // 使用 timingSafeEqual 防止时序攻击
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Creem Webhook 事件类型
 */
export enum CreemWebhookEventType {
  CHECKOUT_COMPLETED = 'checkout.completed',
  CHECKOUT_EXPIRED = 'checkout.expired',
  ORDER_CREATED = 'order.created',
  ORDER_COMPLETED = 'order.completed',
  REFUND_CREATED = 'refund.created',
}

/**
 * Creem Webhook 事件数据结构
 */
export interface CreemWebhookEvent {
  eventType: CreemWebhookEventType | string;
  timestamp: string;
  object: {
    checkout_id?: string;
    order_id?: string;
    product_id?: string;
    request_id?: string;
    status?: string;
    customer_id?: string;
    amount?: number;
    currency?: string;
    [key: string]: any;
  };
}
