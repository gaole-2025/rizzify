'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black px-4">
      <div className="max-w-md w-full bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-8 space-y-4 text-center">
        <div className="text-5xl">⏸️</div>
        <h1 className="text-2xl font-bold text-white">Payment Cancelled</h1>
        <p className="text-yellow-400">You cancelled the payment. No charges were made.</p>
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
    </div>
  );
}
