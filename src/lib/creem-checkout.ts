/**
 * 前端 Creem 支付集成工具
 */

/**
 * 发起 Creem 支付流程
 * @param plan 计划类型 ("start" | "pro")
 */
export async function initiateCreemCheckout(plan: 'start' | 'pro') {
  try {
    // 1. 调用后端创建 Checkout Session
    const response = await fetch('/api/creem/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout');
    }

    const data = await response.json();
    const { checkoutUrl } = data;

    if (!checkoutUrl) {
      throw new Error('No checkout URL returned');
    }

    // 2. 跳转到 Creem 收银台（同窗口跳转，官方推荐）
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('❌ Creem checkout error:', error);
    alert(`Payment error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
