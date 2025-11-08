'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // 从 URL 参数获取信息
        const checkoutId = searchParams?.get('checkout_id');
        const orderId = searchParams?.get('order_id');
        const requestId = searchParams?.get('request_id');
        // 即使缺少 URL 参数，也不阻止跳转

        // 可选：调用你的后端验证支付状态
        // const response = await fetch('/api/payment/verify', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ checkoutId, orderId, requestId }),
        // });
        // const data = await response.json();

        // 由于 Webhook 是异步的，这里只显示成功提示
        // 真正的权限开通由 Webhook 处理
        setStatus('success');
        setMessage('Payment completed! Your generation task is starting...');

        // 3 秒后跳转回生成页面
        setTimeout(() => {
          try { window.sessionStorage.setItem('rizzify.resumeAfterPayment', '1') } catch {}
          router.push('/gen-image');
        }, 2000);
        // 兜底：再过 2 秒使用硬跳转，确保一定到达生成页
        setTimeout(() => {
          try { window.location.replace('/gen-image') } catch {}
        }, 4000);
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('Failed to verify payment status');
      }
    };

    checkPaymentStatus();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black px-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-white text-lg">Verifying payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-8 space-y-4 text-center">
            <div className="text-5xl">✅</div>
            <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
            <p className="text-green-400">{message}</p>
            <p className="text-white/60 text-sm">Redirecting to generation page...</p>
            <Link
              href="/gen-image"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Go to Generation
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 space-y-4 text-center">
            <div className="text-5xl">❌</div>
            <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
            <p className="text-red-400">{message}</p>
            <div className="space-y-2 pt-4">
              <Link
                href="/gen-image"
                className="block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Try Again
              </Link>
              <Link
                href="/start"
                className="block px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
