"use client"

import { useRouter } from "next/navigation"

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  errorCode?: string
}

export function ErrorBanner({ message, onRetry, errorCode }: ErrorBannerProps) {
  const router = useRouter()

  // 针对 daily_quota_exceeded 的特殊处理
  if (errorCode === 'daily_quota_exceeded') {
    return (
      <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-4 py-3">
        <p className="mb-3 text-sm text-amber-200">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/results')}
            className="rounded-lg border border-amber-300/40 px-3 py-1 text-xs text-amber-200 transition hover:border-amber-200 hover:text-amber-50"
          >
            View Results
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-amber-300/40 px-3 py-1 text-xs text-amber-200 transition hover:border-amber-200 hover:text-amber-50"
          >
            Choose Other Plan
          </button>
        </div>
      </div>
    )
  }

  // 默认错误处理
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300/40 px-3 py-1 text-xs text-red-200 transition hover:border-red-200 hover:text-red-50"
        >
          Retry
        </button>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className ?? ''}`} aria-hidden="true" />
}

export function StatusNote({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
      {text}
    </div>
  )
}
