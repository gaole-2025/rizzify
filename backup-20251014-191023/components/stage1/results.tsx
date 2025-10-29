"use client"

import { useEffect, useMemo, useRef, type ReactNode } from "react"
import Image from "next/image"
import clsx from "clsx"
import type {
  GenerationSection,
  NotesCopy,
  OriginalCard,
  ResultCardData,
  SectionKey,
  SectionNavCounts,
  SectionState,
} from "@/lib/stage1-data"
import { ErrorBanner } from "@/components/stage1/common"

export const SECTION_META: Record<SectionKey, { label: string; accent: string; description?: string }> = {
  uploaded: {
    label: "Uploaded",
    accent: "bg-white/10 text-white",
    description: "Reference photo that trained this task.",
  },
  free: {
    label: "Free",
    accent: "bg-red-500/20 text-red-200 border border-red-400/40",
    description: "Watermarked - Expires in 24h",
  },
  start: {
    label: "Start",
    accent: "bg-blue-500/20 text-blue-100 border border-blue-400/40",
    description: "Starter plan outputs",
  },
  pro: {
    label: "Pro",
    accent: "bg-purple-500/20 text-purple-100 border border-purple-400/40",
    description: "Pro plan outputs",
  },
}

export function SectionNav({ counts }: { counts: SectionNavCounts }) {
  const entries: Array<{ key: SectionKey; total: number }> = [
    { key: "uploaded", total: counts.uploaded },
    { key: "free", total: counts.free },
    { key: "start", total: counts.start },
    { key: "pro", total: counts.pro },
  ]

  const handleScroll = (key: SectionKey) => {
    const el = document.getElementById(`section-${key}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <nav className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-black/30 p-1 text-xs text-white/70">
      {entries.map(({ key, total }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleScroll(key)}
          className="rounded-full px-3 py-1 capitalize transition hover:bg-white/10"
        >
          {SECTION_META[key].label} ({total})
        </button>
      ))}
    </nav>
  )
}

interface SectionHeaderProps {
  section: SectionKey
  description?: string
  actions?: ReactNode
  count: number
}

function SectionHeader({ section, description, actions, count }: SectionHeaderProps) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-2 text-white">
        <div className="inline-flex items-center gap-2">
          <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", SECTION_META[section].accent)}>
            {SECTION_META[section].label}
          </span>
          <span className="text-xs text-white/50">{count} {count === 1 ? "photo" : "photos"}</span>
        </div>
        {description && <p className="text-xs text-white/50">{description}</p>}
      </div>
      {actions}
    </header>
  )
}

interface SectionToolbarProps {
  state: SectionState
  disabled?: boolean
  onDownloadAll: () => void
  onDeleteAll: () => void
}

export function SectionToolbar({ state, disabled, onDownloadAll, onDeleteAll }: SectionToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
      <button
        type="button"
        className={clsx(
          "rounded-full border border-white/20 px-3 py-1 transition",
          state.downloadingAll ? "opacity-60" : "hover:border-white/40 hover:bg-white/10",
          disabled && "opacity-40 cursor-not-allowed"
        )}
        disabled={disabled || state.downloadingAll}
        onClick={onDownloadAll}
      >
        {state.downloadingAll ? "Preparing download..." : "Download all"}
      </button>
      <button
        type="button"
        className={clsx(
          "rounded-full border border-red-300/60 px-3 py-1 text-red-200 transition",
          state.deletingAll ? "opacity-60" : "hover:border-red-200 hover:text-red-50",
          disabled && "opacity-40 cursor-not-allowed"
        )}
        disabled={disabled || state.deletingAll}
        onClick={onDeleteAll}
      >
        {state.deletingAll ? "Deleting..." : "Delete all"}
      </button>
    </div>
  )
}

interface UploadedSectionProps {
  items: OriginalCard[]
  state: SectionState
  disabled?: boolean
  onDownloadAll: () => void
  onDeleteAll: () => void
}

export function UploadedSection({ items, state, disabled, onDownloadAll, onDeleteAll }: UploadedSectionProps) {
  return (
    <section id="section-uploaded" className="space-y-4">
      <SectionHeader
        section="uploaded"
        description={SECTION_META.uploaded.description}
        actions={
          items.length > 0 ? (
            <SectionToolbar
              state={state}
              disabled={disabled}
              onDownloadAll={onDownloadAll}
              onDeleteAll={onDeleteAll}
            />
          ) : null
        }
        count={items.length}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
          >
            <div className="mb-3 text-xs uppercase tracking-wide text-white/40">Uploaded reference</div>
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              <Image src={item.url} alt="Uploaded reference" fill className="object-cover" />
            </div>
            <div className="mt-3 text-xs text-white/50">Uploaded {new Date(item.createdAt).toLocaleString()}</div>
          </article>
        ))}
        {items.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-white/50">
            No uploaded references for this task.
          </div>
        )}
      </div>
    </section>
  )
}

interface ResultSectionProps {
  section: GenerationSection
  data: ResultCardData[]
  state: SectionState
  disabled?: boolean
  onSelect: (index: number) => void
  onDownloadAll: () => void
  onDeleteAll: () => void
  error?: string | null
}

export function ResultSection({
  section,
  data,
  state,
  disabled,
  onSelect,
  onDownloadAll,
  onDeleteAll,
  error,
}: ResultSectionProps) {
  const description = SECTION_META[section].description

  const content = data.length === 0 ? (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-white/50">
      {section === "free" ? "No free previews in this task." : section === "start" ? "No photos in Start." : "No photos in Pro."}
    </div>
  ) : (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((card, index) => (
        <ResultCard key={card.id} card={card} index={index} onSelect={() => onSelect(index)} disabled={disabled || state.deletingAll} />
      ))}
    </div>
  )

  return (
    <section id={`section-${section}`} className="space-y-4">
      <SectionHeader
        section={section}
        description={description}
        count={data.length}
        actions={
          <SectionToolbar
            state={state}
            disabled={disabled}
            onDownloadAll={onDownloadAll}
            onDeleteAll={onDeleteAll}
          />
        }
      />
      {error && <ErrorBanner message={error} />}
      {content}
    </section>
  )
}

interface ResultCardProps {
  card: ResultCardData
  index: number
  disabled?: boolean
  onSelect: () => void
}

function ResultCard({ card, index, disabled, onSelect }: ResultCardProps) {
  const expiresAt = card.expiresAt ? Date.parse(card.expiresAt) : undefined
  const now = Date.now()
  const expired = typeof expiresAt === "number" && !Number.isNaN(expiresAt) && expiresAt <= now

  const remaining = useMemo(() => {
    if (!card.expiresAt || expired) return null
    const diffMs = expiresAt! - now
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const hourPart = hours > 0 ? `${hours}h ` : ""
    return `${hourPart}${minutes.toString().padStart(2, "0")}m left`
  }, [card.expiresAt, expired, expiresAt, now])

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={clsx(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 text-left transition",
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-white/30"
      )}
    >
      <div className="relative aspect-square w-full">
        <Image src={card.url} alt={`Generated photo ${index + 1}`} fill className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2 text-xs text-white/70">
          <span className="font-medium capitalize">{SECTION_META[card.section].label}</span>
          <span>{new Date(card.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        {expired ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-500/80 px-3 py-1 text-xs font-semibold text-white">
            Expired
          </span>
        ) : remaining ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white/80">
            {remaining}
          </span>
        ) : null}
      </div>
    </button>
  )
}

interface PreviewDrawerProps {
  open: boolean
  section: GenerationSection
  taskId: string
  cards: ResultCardData[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onDelete: (index: number) => void
  onDownload?: (index: number) => void
  onCopyLink?: (index: number) => void
}

export function PreviewDrawer({
  open,
  section,
  taskId,
  cards,
  index,
  onClose,
  onPrev,
  onNext,
  onDelete,
  onDownload,
  onCopyLink,
}: PreviewDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const card = cards[index]

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        onPrev()
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        onNext()
      }
    }
    window.addEventListener("keydown", handleKey)
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 50)
    return () => {
      window.removeEventListener("keydown", handleKey)
      window.clearTimeout(timer)
    }
  }, [open, onClose, onPrev, onNext])

  if (!open || !card) return null

  const expired = card.expiresAt ? Date.parse(card.expiresAt) <= Date.now() : false
  const formattedCreated = new Date(card.createdAt).toLocaleString()

  const downloadName = (() => {
    const created = new Date(card.createdAt)
    const stamp = `${created.getUTCFullYear()}${String(created.getUTCMonth() + 1).padStart(2, "0")}${String(created.getUTCDate()).padStart(2, "0")}${String(created.getUTCHours()).padStart(2, "0")}${String(created.getUTCMinutes()).padStart(2, "0")}`
    const ordinal = String(index + 1).padStart(2, "0")
    return `${taskId}_${section}_${ordinal}_${stamp}.jpg`
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" role="dialog" aria-modal="true">
      <div className="relative flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-white/10 bg-black/90 p-6 text-white shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <div className="flex flex-col">
            <span className="font-semibold">{SECTION_META[section].label} - {downloadName}</span>
            <span className="text-xs text-white/40">Generated {formattedCreated}</span>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60 transition hover:border-white/40 hover:text-white"
            onClick={onClose}
          >
            Close (Esc)
          </button>
        </header>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10">
          <Image src={card.url} alt={`Preview ${card.id}`} fill className="object-cover" priority />
          {expired && (
            <span className="absolute left-4 top-4 rounded-full bg-red-500/80 px-3 py-1 text-sm font-semibold text-white">
              Expired
            </span>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-full border border-white/20 px-3 py-1 transition hover:border-white/40 hover:text-white"
            >
              {"< Prev"}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full border border-white/20 px-3 py-1 transition hover:border-white/40 hover:text-white"
            >
              {"Next >"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={expired}
              onClick={() => onDownload?.(index)}
              className={clsx(
                "rounded-full border border-white/20 px-3 py-1 transition",
                expired ? "opacity-40 cursor-not-allowed" : "hover:border-white/40 hover:text-white"
              )}
            >
              Download
            </button>
            <button
              type="button"
              disabled={expired}
              onClick={() => onCopyLink?.(index)}
              className={clsx(
                "rounded-full border border-white/20 px-3 py-1 transition",
                expired ? "opacity-40 cursor-not-allowed" : "hover:border-white/40 hover:text-white"
              )}
            >
              Copy link
            </button>
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="rounded-full border border-red-300/60 px-3 py-1 text-red-200 transition hover:border-red-200 hover:text-red-50"
            >
              Delete
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export function NotesBar({ notes }: { notes: NotesCopy }) {
  return (
    <div className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-black/30 px-5 py-4 text-xs text-white/60">
      <span>- {notes.freePolicy}</span>
      <span>- {notes.retention}</span>
      <span>- {notes.reset}</span>
    </div>
  )
}




