"use client"

import clsx from "clsx"
import type { KeyboardEvent } from "react"
import { PlanCardData, PaymentSheetCopy } from "@/lib/stage1-data"

interface PlanCardProps {
  plan: PlanCardData
  selected: boolean
  onSelect: (code: PlanCardData["code"]) => void
  disabled?: boolean
}

export function PlanCard({ plan, selected, onSelect, disabled }: PlanCardProps) {
  const priceLabel = plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}`

  const handleSelect = () => {
    if (!disabled) {
      onSelect(plan.code)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect(plan.code)
    }
  }

  return (
    <article
      role="radio"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={clsx(
        "relative flex h-full cursor-pointer flex-col rounded-3xl border px-6 py-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
        selected ? "border-white bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/85",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {plan.badge && (
        <span className="absolute -top-3 right-6 rounded-full border border-amber-200/60 bg-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-100">
          {plan.badge}
        </span>
      )}
      <header className="mb-5 space-y-1">
        <h3 className="text-lg font-semibold text-white">{plan.title}</h3>
        <p className="text-sm text-white/60">One-time purchase</p>
      </header>
      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{priceLabel}</span>
        {plan.price > 0 && <span className="text-xs text-white/50">USD</span>}
      </div>
      <dl className="mb-5 grid grid-cols-2 gap-3 text-xs uppercase tracking-wide text-white/60">
        <div>
          <dt className="text-white/40">Quota</dt>
          <dd className="text-sm text-white">{plan.quota}</dd>
        </div>
        <div>
          <dt className="text-white/40">Styles</dt>
          <dd className="text-sm text-white">{plan.styles}</dd>
        </div>
      </dl>
      <ul className="mb-6 space-y-2 text-sm text-white/70">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span aria-hidden="true">-</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <span
          className={clsx(
            "inline-flex items-center rounded-full px-5 py-2 text-sm font-medium transition",
            selected ? "bg-white text-black" : "border border-white/20 text-white hover:border-white/40 hover:bg-white/10"
          )}
        >
          {selected ? "Selected" : "Choose plan"}
        </span>
      </div>
    </article>
  )
}

interface PlansGridProps {
  plans: PlanCardData[]
  selected?: PlanCardData["code"]
  onSelect: (code: PlanCardData["code"]) => void
  disabled?: boolean
}

export function PlansGrid({ plans, selected, onSelect, disabled }: PlansGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.code}
          plan={plan}
          selected={selected === plan.code}
          onSelect={onSelect}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

interface PaymentSheetProps {
  open: boolean
  plan?: PlanCardData
  copy: PaymentSheetCopy
  onClose: () => void
  onConfirm: () => void
}

export function PaymentSheet({ open, plan, copy, onClose, onConfirm }: PaymentSheetProps) {
  if (!open || !plan) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/90 p-6 text-white shadow-2xl">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">{copy.heading}</p>
            <h2 className="text-2xl font-semibold">{plan.title}</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60 transition hover:border-white/40 hover:text-white"
            onClick={onClose}
          >
            {copy.cancelLabel}
          </button>
        </header>
        <p className="mb-4 text-sm text-white/70">{copy.description}</p>
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <p className="mb-2">
            <strong>Includes:</strong> {plan.quota} photos / {plan.styles} styles
          </p>
          <ul className="space-y-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span aria-hidden="true">-</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            onClick={onClose}
          >
            {copy.cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            onClick={onConfirm}
          >
            {copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}




