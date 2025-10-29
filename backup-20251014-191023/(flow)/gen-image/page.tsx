
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PaymentSheet, PlansGrid } from "@/components/stage1/plans"
import { ErrorBanner } from "@/components/stage1/common"
import { generationMock } from "@/lib/stage1-data"
import {
  createPaymentSession,
  getTaskStatus,
  startGeneration,
  ApiError,
} from "@/lib/api/client"
import { useDevAuth, useDevMocks, useDevPageState } from "@/components/dev/DevToolbar"
import { writeLastTaskId } from "@/lib/stage2-storage"

const UPLOAD_SESSION_KEY = "rizzify.stage2.upload"
const POLL_INTERVAL_MS = 1200

interface UploadSession {
  fileId: string
  gender?: "male" | "female"
}

type PlanCode = "free" | "start" | "pro"
type ViewState = "choose" | "processing"

type TaskRuntimeState = {
  taskId: string
  status: "queued" | "running" | "done" | "error"
  etaSeconds?: number | null
  progress?: number | null
  errorMessage?: string | null
}

function readUploadSession(): UploadSession | null {
  if (typeof window === "undefined") return null
  const stored = window.sessionStorage.getItem(UPLOAD_SESSION_KEY)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored) as UploadSession
    if (!parsed.fileId) return null
    return parsed
  } catch {
    return null
  }
}

function clearUploadSession() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(UPLOAD_SESSION_KEY)
}

function useUploadSession() {
  const [session, setSession] = useState<UploadSession | null>(() => readUploadSession())
  useEffect(() => {
    setSession(readUploadSession())
  }, [])
  return session
}

export default function GenImagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const uploadSession = useUploadSession()
  const { authState, guardBypass } = useDevAuth()
  const { paymentMock, queueMock } = useDevMocks()
  const { state: pageState, setState: setPageState } = useDevPageState("gen-image", "Generate", "default")

  const [view, setView] = useState<ViewState>("choose")
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null)
  const [runtime, setRuntime] = useState<TaskRuntimeState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastIdempotency = useRef<string | null>(null)

  
  const chooseCopy = generationMock.chooseCopy
  const plans = useMemo(() => generationMock.plans, [])
  const processingCopy = generationMock.processingView
  const paymentCopy = generationMock.paymentSheet

  const isAuthed = authState !== "guest"
  const isLoading = pageState === "loading"
  const isDisabled = pageState === "disabled"
  const showProcessing = view === "processing"
  const showErrorBanner = Boolean(errorMessage) && view === "processing"

  useEffect(() => {
    if (!isAuthed && !guardBypass) {
      router.replace("/login?redirect=/gen-image")
    }
  }, [guardBypass, isAuthed, router])

  
  useEffect(() => {
    const genderParam = searchParams?.get("gender")
    if (genderParam && uploadSession && !uploadSession.gender) {
      window.sessionStorage.setItem(
        UPLOAD_SESSION_KEY,
        JSON.stringify({ ...uploadSession, gender: genderParam as UploadSession["gender"] })
      )
    }
  }, [searchParams, uploadSession])

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (pageState === "error") {
      setErrorMessage("Something went wrong during processing. Please retry.")
      setView("processing")
      setRuntime((prev) => (prev ? { ...prev, status: "error" } : prev))
    }
  }, [pageState])

  const startPolling = useCallback((taskId: string) => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }

    if (queueMock === "empty") {
      setErrorMessage("Queue is currently unavailable. Please try again later.")
      setRuntime(null)
      setView("choose")
      return
    }

    const poll = async () => {
      try {
        const status = await getTaskStatus(taskId)
        const effectiveStatus =
          queueMock === "processing" && status.status === "done" ? "running" : status.status
        setRuntime({
          taskId,
          status: effectiveStatus,
          etaSeconds: status.etaSeconds ?? null,
          progress: status.progress ?? null,
          errorMessage: status.error?.message ?? null,
        })

        if (status.status === "done") {
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
          writeLastTaskId(taskId)
          clearUploadSession()
          router.push(`/results/${taskId}`)
        }

        if (status.status === "error") {
          setErrorMessage(status.error?.message ?? "Generation failed. Please try again.")
          setRuntime((prev) => (prev ? { ...prev, status: "error", errorMessage: status.error?.message ?? null } : null))
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      } catch (err) {
        console.error(err)
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
        const message = err instanceof ApiError ? err.message : "Failed to poll task status."
        setErrorMessage(message)
        setRuntime((prev) => (prev ? { ...prev, status: "error", errorMessage: message } : prev))
      }
    }

    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
  }, [queueMock, router])

  const resetToPlans = useCallback(() => {
    setSelectedPlan(null)
    setView("choose")
    setRuntime(null)
    setErrorMessage(null)
    setIsPaymentSheetOpen(false)
    setPageState("default")
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [setPageState])

  const beginGeneration = useCallback(async (plan: PlanCode) => {
    if (!uploadSession?.fileId || !uploadSession.gender) {
      setErrorMessage("Missing upload session. Please start again.")
      return
    }

    if (queueMock === "empty") {
      setErrorMessage("Queue is currently unavailable. Please try again later.")
      setView("choose")
      return
    }

    // 🚀 立即跳转到processing界面，提供即时反馈
    const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `idem_${Date.now()}`
    lastIdempotency.current = idempotencyKey

    // 设置processing状态，但不设置taskId
    setRuntime({
      taskId: "", // 空的taskId表示正在初始化
      status: "queued"
    })
    setView("processing")
    setErrorMessage(null)

    // 异步调用生成API
    console.log("🚀 Starting async generation call...")
    startGeneration({
      plan,
      gender: uploadSession.gender,
      fileId: uploadSession.fileId,
      idempotencyKey,
    }).then(response => {
      console.log("✅ Generation API successful:", response.taskId)
      const initialStatus = queueMock === "processing" ? "running" : "queued"
      setRuntime({
        taskId: response.taskId,
        status: initialStatus
      })
      startPolling(response.taskId)
    }).catch(err => {
      console.error("❌ Generation API failed:", err)

      let message = "Failed to start generation. Please try again."

      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.status === 400) {
          if (err.code === 'invalid_plan') {
            message = "Selected plan is no longer available. Please choose a different plan."
          } else if (err.code === 'invalid_file') {
            message = "Uploaded file is invalid or expired. Please upload a new photo."
          } else if (err.code === 'quota_exceeded') {
            message = "You've reached your generation limit. Please upgrade your plan or try again later."
          } else if (err.code?.startsWith('invalid_')) {
            message = `Generation error: ${err.message || 'Invalid request. Please try again.'}`
          } else {
            message = err.message || "Failed to start generation. Please try again."
          }
        } else if (err.status === 402) {
          message = "Payment required to start generation. Please select a plan and complete payment."
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 30
          message = `Too many generation attempts. Please wait ${retryAfter} seconds before trying again.`
        } else if (err.status === 503) {
          message = "Generation service is temporarily unavailable. Please try again in a few minutes."
        } else {
          message = err.message || "Failed to start generation. Please try again."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setErrorMessage(message)
      setRuntime(prev => ({
        ...prev,
        status: "error",
        errorMessage: message
      }))
    })
  }, [queueMock, startPolling, uploadSession])

  const handlePlanSelect = (code: PlanCode) => {
    if (isDisabled || isLoading) return

    if (!uploadSession) {
      setErrorMessage("Upload session not found. Please upload a photo again.")
      return
    }

    setSelectedPlan(code)
    if (code === "free") {
      beginGeneration("free")
    } else if (paymentMock === "auto") {
      beginGeneration(code)
    } else {
      setIsPaymentSheetOpen(true)
    }
  }

  const handlePaymentConfirm = async () => {
    const plan = selectedPlan ?? "start"
    try {
      if (paymentMock === "auto") {
        setIsPaymentSheetOpen(false)
        beginGeneration(plan)
        return
      }
      await createPaymentSession({ plan })
      setIsPaymentSheetOpen(false)
      beginGeneration(plan)
    } catch (err) {
      console.error(err)

      let message = "Payment failed. Please try again."

      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.status === 400) {
          if (err.code === 'invalid_plan') {
            message = "Selected plan is not available. Please choose a different plan."
          } else if (err.code === 'payment_failed') {
            message = "Payment was declined. Please check your payment details and try again."
          } else if (err.code?.startsWith('invalid_')) {
            message = `Payment error: ${err.message || 'Invalid payment details. Please try again.'}`
          } else {
            message = err.message || "Payment setup failed. Please try again."
          }
        } else if (err.status === 402) {
          message = "Payment session expired. Please try selecting your plan again."
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 60
          message = `Too many payment attempts. Please wait ${retryAfter} seconds before trying again.`
        } else {
          message = err.message || "Payment failed. Please try again."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setErrorMessage(message)
    }
  }

  const handlePaymentClose = () => {
    setIsPaymentSheetOpen(false)
  }

  if (!isAuthed && !guardBypass) {
    return null
  }

  if (!uploadSession?.fileId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-white">
        <ErrorBanner message="Upload session expired. Please start again." onRetry={() => router.push("/start")} />
        <button
          type="button"
          className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/10"
          onClick={() => router.push("/start")}
        >
          Go back to start
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg" aria-busy={isLoading}>
        <header className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold text-white">{chooseCopy.title}</h1>
          <p className="text-sm text-white/60">{chooseCopy.subtext}</p>
          {pageState === "empty" && <p className="text-xs text-amber-300">No plans available in this demo state.</p>}
        </header>

        {showErrorBanner && <ErrorBanner message={errorMessage ?? ""} onRetry={resetToPlans} />}

        {!showProcessing && (
          <div className={isLoading ? "pointer-events-none opacity-60" : undefined}>
            <PlansGrid
              plans={plans}
              selected={selectedPlan ?? undefined}
              onSelect={handlePlanSelect}
              disabled={isDisabled || isLoading}
            />
          </div>
        )}

        {showProcessing && (
          <div className="flex flex-col items-center gap-6 py-12" aria-live="polite" aria-busy="true">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold text-white">
                {!runtime?.taskId && "Initializing your AI generation..."}
                {runtime?.taskId && runtime.status === "queued" && "Starting AI processing..."}
                {runtime?.taskId && runtime.status === "running" && processingCopy.title}
                {runtime?.taskId && runtime.status === "error" && "Generation failed"}
              </h2>
              <p className="max-w-sm text-sm text-white/70">
                {!runtime?.taskId && "Preparing your AI generation task..."}
                {runtime?.taskId && runtime.status === "queued" && "Your task is queued and will start processing soon..."}
                {runtime?.taskId && runtime.status === "running" && processingCopy.message}
                {runtime?.taskId && runtime.status === "error" && runtime.errorMessage || "Something went wrong. Please try again."}
              </p>
              {!runtime?.taskId && (
                <p className="text-xs text-white/50 animate-pulse">Starting generation...</p>
              )}
              {runtime?.taskId && runtime.status === "running" && (
                <p className="text-xs text-white/50">
                  {runtime.progress != null ? `Progress ${runtime.progress}%` : "Processing"}
                  {runtime.etaSeconds != null ? ` - ETA ${runtime.etaSeconds}s` : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {showProcessing && runtime?.status === "error" && (
          <div className="mt-6">
            <button
              type="button"
              className="rounded-full border border-white/30 px-5 py-2 text-sm text-white transition hover:border-white/50 hover:bg-white/10"
              onClick={resetToPlans}
            >
              Back to plan selection
            </button>
          </div>
        )}
      </section>

      <PaymentSheet
        open={isPaymentSheetOpen}
        plan={plans.find((plan) => plan.code === (selectedPlan ?? undefined))}
        copy={paymentCopy}
        onClose={handlePaymentClose}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  )
}





