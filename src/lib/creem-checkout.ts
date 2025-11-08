/**
 * 前端 Creem 支付集成工具
 */

export interface CreemCheckoutParams {
  plan: 'start' | 'pro';
  uploadId: string;
  gender: 'male' | 'female';
}

/**
 * 发起 Creem 支付流程
 * @param plan 计划类型 ("start" | "pro")
 * @param uploadId 上传的文件 ID
 * @param gender 性别 ("male" | "female")
 */
export async function initiateCreemCheckout(plan: 'start' | 'pro', uploadId?: string, gender?: string) {
  try {
    // 获取 upload session 中的信息
    const uploadSession = (() => {
      if (typeof window === 'undefined') return null;
      const stored = window.sessionStorage.getItem('rizzify.stage2.upload');
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    })();

    const finalUploadId = uploadId || uploadSession?.fileId;
    const finalGender = gender || uploadSession?.gender;

    if (!finalUploadId || !finalGender) {
      throw new Error('Missing upload information. Please upload a photo first.');
    }

    // 1. 获取认证 token
    const { getSupabaseBrowserClient } = await import('@/src/lib/supabaseClient');
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated. Please log in first.');
    }

    // 2. 调用后端创建 Checkout Session
    const response = await fetch('/api/creem/checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ 
        plan, 
        uploadId: finalUploadId, 
        gender: finalGender 
      }),
      credentials: 'include',
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
