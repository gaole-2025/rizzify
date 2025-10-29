"use client"

import { QueueItem } from "@/lib/stage1-data"

const statusColors: Record<QueueItem["status"], string> = {
  queued: "text-yellow-300",
  running: "text-blue-300",
  done: "text-green-300",
  error: "text-red-300",
}

const statusLabel: Record<QueueItem["status"], string> = {
  queued: "Queued",
  running: "Running",
  done: "Done",
  error: "Error",
}

interface ProgressCardProps {
  item: QueueItem
}

export function ProgressCard({ item }: ProgressCardProps) {
  const etaLabel = item.etaSeconds ? `${Math.ceil(item.etaSeconds / 60)} min` : "--"
  const progress = Math.round((item.progress ?? 0) * 100)

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
      <header className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/50">Task</span>
        <span className={`text-xs font-semibold ${statusColors[item.status]}`}>{statusLabel[item.status]}</span>
      </header>
      <div className="mt-1 text-lg font-semibold text-white">#{item.id}</div>
      <div className="mt-3 flex items-center justify-between text-xs text-white/50">
        <span>ETA: {etaLabel}</span>
        {item.status === "running" && <span>{progress}%</span>}
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-400 transition-all"
          style={{ width: `${item.status === "done" ? 100 : progress}%` }}
        />
      </div>
    </article>
  )
}

