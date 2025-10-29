"use client"

import { useMemo, useRef, type ChangeEvent, type ReactNode } from "react"
import Image from "next/image"
import clsx from "clsx"
import {
  Eligibility,
  FeedbackFormState,
  FeedbackLimits,
  FeedbackRateLimit,
  FeedbackSubmitState,
} from "@/lib/stage1-data"
import { ErrorBanner } from "@/components/stage1/common"

interface EligibilityGateProps {
  eligibility: Eligibility
  onCreateTask: () => void
  children: ReactNode
}

export function EligibilityGate({ eligibility, onCreateTask, children }: EligibilityGateProps) {
  if (!eligibility.hasCompletedTask) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
        <h2 className="mb-3 text-2xl font-semibold text-white">You need a generation first</h2>
        <p className="mx-auto mb-6 max-w-md text-sm text-white/60">
          You need at least one generation to send feedback.
        </p>
        <button
          type="button"
          onClick={onCreateTask}
          className="rounded-full border border-white/20 px-6 py-3 text-sm text-white transition hover:border-white/40 hover:bg-white/10"
        >
          Go generate
        </button>
      </section>
    )
  }
  return <>{children}</>
}

interface ScreenshotGridProps {
  screenshots: string[]
  maxFiles: number
  disabled?: boolean
  onAdd: (files: FileList) => void
  onRemove: (index: number) => void
  accept: string[]
  error?: string | null
}

function ScreenshotGrid({ screenshots, maxFiles, disabled, onAdd, onRemove, accept, error }: ScreenshotGridProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const remainingSlots = Math.max(0, maxFiles - screenshots.length)

  const handleSelect = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onAdd(files)
      event.target.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {screenshots.map((src, index) => (
          <div key={index} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/20 bg-black/30">
            <Image src={src} alt={`Screenshot ${index + 1}`} fill unoptimized sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute inset-0 hidden items-center justify-center bg-black/70 text-xs font-semibold text-white transition group-hover:flex"
            >
              Remove
            </button>
          </div>
        ))}
        {Array.from({ length: remainingSlots }).map((_, slotIndex) => (
          <button
            key={`placeholder-${slotIndex}`}
            type="button"
            onClick={handleSelect}
            disabled={disabled}
            className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 text-2xl text-white/40 transition hover:border-white/40 hover:text-white"
          >
            +
          </button>
        ))}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(",")}
        multiple
        hidden
        onChange={handleChange}
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <p className="text-xs text-white/40">Up to {maxFiles} screenshots · JPG/PNG only · Max 5MB each.</p>
    </div>
  )
}

interface FeedbackFormProps {
  form: FeedbackFormState
  limits: FeedbackLimits
  rateLimit: FeedbackRateLimit
  submitState: FeedbackSubmitState
  submitting: boolean
  disabled?: boolean
  cooldownRemaining: number
  screenshotError?: string | null
  emailError?: string | null
  onMessageChange: (value: string) => void
  onEmailChange: (value: string) => void
  onAddScreenshots: (files: FileList) => void
  onRemoveScreenshot: (index: number) => void
  onSubmit: () => void
  onViewResults: () => void
  onCloseSuccess: () => void
}

export function FeedbackForm({
  form,
  limits,
  rateLimit,
  submitState,
  submitting,
  disabled,
  cooldownRemaining,
  screenshotError,
  emailError,
  onMessageChange,
  onEmailChange,
  onAddScreenshots,
  onRemoveScreenshot,
  onSubmit,
  onViewResults,
  onCloseSuccess,
}: FeedbackFormProps) {
  const messageLength = useMemo(() => form.message.trim().length, [form.message])
  const messageTooShort = messageLength > 0 && messageLength < limits.minChars
  const messageTooLong = messageLength > limits.maxChars
  const emailInvalid = Boolean(form.email) && Boolean(emailError)
  const isCoolingDown = cooldownRemaining > 0
  const isSubmitDisabled =
    submitting ||
    disabled ||
    messageLength < limits.minChars ||
    messageTooLong ||
    emailInvalid ||
    isCoolingDown

  if (submitState.ticketId && !submitState.loading) {
    return (
      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">Thank you!</h2>
          <p className="text-sm text-white/70">We've received your message and will contact you shortly.</p>
        </header>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-white/20 px-5 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/10"
            onClick={onCloseSuccess}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <header className="space-y-1 text-white">
        <h1 className="text-2xl font-semibold">Contact Us</h1>
      </header>

      {submitState.error && <ErrorBanner message={submitState.error} />}

      <div>
        <label htmlFor="feedback-message" className="mb-2 block text-sm font-semibold text-white">
          Your message
        </label>
        <textarea
          id="feedback-message"
          className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 focus:border-white/40 focus:outline-none"
          maxLength={limits.maxChars}
          value={form.message}
          onChange={(event) => onMessageChange(event.target.value)}
          disabled={disabled || submitting}
          aria-describedby="feedback-message-help"
        />
        <div id="feedback-message-help" className="mt-2 flex items-center justify-between text-xs">
          <span className={clsx(messageTooShort || messageTooLong ? "text-red-300" : "text-white/40")}>Min {limits.minChars} characters.</span>
          <span className="text-white/40">{messageLength}/{limits.maxChars}</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-white">Screenshots (optional)</label>
        <ScreenshotGrid
          screenshots={form.screenshots}
          maxFiles={limits.maxFiles}
          disabled={disabled || submitting}
          accept={limits.accept}
          onAdd={onAddScreenshots}
          onRemove={onRemoveScreenshot}
          error={screenshotError}
        />
      </div>

      <div>
        <label htmlFor="feedback-email" className="mb-2 block text-sm font-semibold text-white">
          Email (optional)
        </label>
        <input
          id="feedback-email"
          type="email"
          value={form.email ?? ""}
          onChange={(event) => onEmailChange(event.target.value)}
          disabled={disabled || submitting}
          className={clsx(
            "w-full rounded-2xl border bg-black/30 px-3 py-2 text-sm",
            emailInvalid ? "border-red-400/60 text-red-200" : "border-white/10 text-white/80 focus:border-white/40"
          )}
          placeholder="you@example.com"
        />
        {emailError && <p className="mt-2 text-xs text-red-300">{emailError}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={clsx(
          "rounded-full px-5 py-2 text-sm font-semibold transition",
          isSubmitDisabled ? "bg-white/30 text-black/50" : "bg-white text-black hover:bg-white/90"
        )}
      >
        {submitting ? "Submitting..." : isCoolingDown ? `Wait ${cooldownRemaining}s` : "Submit"}
      </button>

    </form>
  )
}
