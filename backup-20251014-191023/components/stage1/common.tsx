"use client"

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
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
