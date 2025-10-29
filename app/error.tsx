'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 检测 ChunkLoadError
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      console.log('🔄 Chunk load error detected, reloading page...')
      // 自动刷新页面
      window.location.reload()
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-white/70 mb-6">
          {error.message.includes('ChunkLoadError') 
            ? 'Loading resources... Please wait a moment.'
            : 'An error occurred. Please try again.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
