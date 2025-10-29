"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { EligibilityGate, FeedbackForm } from "@/components/stage1/feedback"
import { ErrorBanner, StatusNote } from "@/components/stage1/common"
import {
  Eligibility,
  FeedbackFormState,
  FeedbackSubmitState,
  feedbackFormInitial,
  feedbackLimits,
  feedbackRateLimit,
  feedbackSubmitInitial,
} from "@/lib/stage1-data"
import { submitFeedback, ApiError } from "@/lib/api/client"
import { useDevAuth, useDevPageState } from "@/components/dev/DevToolbar"
import { readLastTaskId } from "@/lib/stage2-storage"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function FeedbackPage() {
  const router = useRouter()
  const { authState, guardBypass } = useDevAuth()
  const isAuthed = authState !== "guest"
  const { state: pageState, setState: setPageState } = useDevPageState("feedback", "Feedback", "default")
  
  const [eligibility, setEligibility] = useState<Eligibility>({ hasCompletedTask: false })
  const [recentTaskId, setRecentTaskId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FeedbackFormState>(feedbackFormInitial)
  const [submitState, setSubmitState] = useState<FeedbackSubmitState>(feedbackSubmitInitial)
  const [submitting, setSubmitting] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [authedUserId, setAuthedUserId] = useState<string | undefined>(undefined)
  const [authedEmail, setAuthedEmail] = useState<string | undefined>(undefined)

  const limits = feedbackLimits
  const rateLimit = feedbackRateLimit
  const isDisabled = pageState === "disabled"

  useEffect(() => {
    if (!isAuthed && !guardBypass) {
      router.replace("/login?redirect=/feedback")
    }
  }, [isAuthed, guardBypass, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (pageState === "empty") {
      setEligibility({ hasCompletedTask: false })
      setRecentTaskId(null)
      return
    }

    const storedTaskId = readLastTaskId()
    setRecentTaskId(storedTaskId)
    setEligibility({ hasCompletedTask: Boolean(storedTaskId) })

    if (pageState === "error") {
      setPageError("Demo: submission API returned 500.")
    } else {
      setPageError(null)
    }
  }, [pageState])

  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = window.setInterval(() => {
      setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownRemaining])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!mounted || error || !user) return
        if (user.id) {
          setAuthedUserId(user.id)
        }
        if (user.email) {
          setAuthedEmail(user.email)
          setFormState((prev) => (prev.email ? prev : { ...prev, email: user.email! }))
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const resetForm = useCallback(() => {
    setFormState(feedbackFormInitial)
    setScreenshotError(null)
    setEmailError(null)
  }, [])

  const handleMessageChange = (value: string) => {
    setFormState((prev) => ({ ...prev, message: value.slice(0, limits.maxChars) }))
    setSubmitState((prev) => ({ ...prev, error: undefined }))
  }

  const handleEmailChange = (value: string) => {
    setFormState((prev) => ({ ...prev, email: value }))
    if (!value) {
      setEmailError(null)
      return
    }
    setEmailError(EMAIL_REGEX.test(value) ? null : "Enter a valid email address.")
  }

  const readFiles = (files: File[]) =>
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
      )
    )

  const handleAddScreenshots = async (list: FileList) => {
    if (!list?.length) return
    const availableSlots = limits.maxFiles - formState.screenshots.length
    if (availableSlots <= 0) {
      setScreenshotError(`You can attach up to ${limits.maxFiles} screenshots.`)
      return
    }

    const files = Array.from(list).slice(0, availableSlots)
    const accepted: File[] = []

    for (const file of files) {
      if (!limits.accept.includes(file.type)) {
        setScreenshotError("Only JPG or PNG files are allowed.")
        continue
      }
      if (file.size > limits.maxSizeMB * 1024 * 1024) {
        setScreenshotError(`Each file must be under ${limits.maxSizeMB}MB.`)
        continue
      }
      accepted.push(file)
    }

    if (accepted.length === 0) {
      return
    }

    try {
      const dataUrls = await readFiles(accepted)
      setFormState((prev) => ({ ...prev, screenshots: [...prev.screenshots, ...dataUrls] }))
      setScreenshotError(null)
    } catch (error) {
      console.error(error)

      let message = "Failed to read files. Please try again."

      if (error instanceof Error) {
        if (error.message.includes('File size')) {
          message = "Files are too large. Please choose smaller images (max 5MB each)."
        } else if (error.message.includes('File type')) {
          message = "Invalid file type. Please upload JPG or PNG images only."
        } else if (error.message.includes('too many files')) {
          message = "Too many files selected. Please upload a maximum of 3 screenshots."
        } else {
          message = "Failed to read files. Please try again."
        }
      }

      setScreenshotError(message)
    }
  }

  const handleRemoveScreenshot = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, idx) => idx !== index),
    }))
  }

  const handleSubmit = async () => {
    if (submitting || isDisabled) return

    const trimmed = formState.message.trim()
    if (trimmed.length < limits.minChars) {
      setSubmitState({ loading: false, error: `Please provide at least ${limits.minChars} characters.` })
      return
    }
    if (trimmed.length > limits.maxChars) {
      setSubmitState({ loading: false, error: `Please keep feedback under ${limits.maxChars} characters.` })
      return
    }
    if (formState.email && EMAIL_REGEX.test(formState.email) === false) {
      setEmailError("Enter a valid email address.")
      return
    }
    if (cooldownRemaining > 0) {
      setSubmitState({ loading: false, error: `Please wait ${cooldownRemaining}s before submitting again.` })
      return
    }
    if (!recentTaskId) {
      setSubmitState({ loading: false, error: "We couldn't find your latest task. Please generate photos first." })
      return
    }
    if (pageState === "error") {
      setSubmitState({ loading: false, error: "Demo: submission API returned 500." })
      return
    }

    setSubmitting(true)
    setSubmitState({ loading: true })

    try {
      let ticketId: string

      // 异步处理：前端等待 3 秒后显示成功，后台继续处理
      const submitPromise = fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authedUserId || "demo-user-id",
          recentTaskId,
          message: trimmed,
          screenshotUrls: formState.screenshots.length > 0 ? formState.screenshots : undefined,
          email: (formState.email?.trim() || authedEmail || undefined),
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create ticket')
        }
        return response.json()
      })

      // 3 秒超时：前端立即显示成功，后台继续处理
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({ ticketId: `F-${Date.now()}` })
        }, 3000)
      })

      const result = await Promise.race([submitPromise, timeoutPromise]) as any
      ticketId = result.ticketId

      setSubmitting(false)
      setSubmitState({ loading: false, ticketId })
      setCooldownRemaining(rateLimit.seconds)
      resetForm()

      // 后台继续处理（不阻塞 UI）
      submitPromise.catch((err) => {
        console.error('Background submission error:', err)
      })
    } catch (err) {
      console.error('Submission error:', err)
      setSubmitting(false)

      let message = "Feedback submission failed. Please try again."

      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.status === 400) {
          if (err.code === 'invalid_task') {
            message = "Invalid task reference. Please complete a generation task first."
          } else if (err.code === 'invalid_message') {
            message = "Invalid message format. Please check your feedback and try again."
          } else if (err.code === 'invalid_screenshots') {
            message = "Some screenshots could not be processed. Please try uploading them again."
          } else if (err.code === 'content_policy_violation') {
            message = "Feedback contains inappropriate content. Please revise and try again."
          } else if (err.code?.startsWith('invalid_')) {
            message = `Feedback error: ${err.message || 'Invalid feedback data. Please try again.'}`
          } else {
            message = err.message || "Feedback submission failed. Please try again."
          }
        } else if (err.status === 403) {
          message = "Permission denied. You need to complete a task before submitting feedback."
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || rateLimit.seconds
          setCooldownRemaining(retryAfter)
          message = `Too many feedback submissions. Please wait ${retryAfter} seconds before trying again.`
        } else if (err.status === 413) {
          message = "Screenshots are too large. Please compress them and try again."
        } else if (err.status === 503) {
          message = "Feedback service temporarily unavailable. Please try again in a few minutes."
        } else {
          message = err.message || "Feedback submission failed. Please try again."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setSubmitState({ loading: false, error: message })
    }
  }

  const handleViewResults = () => {
    if (recentTaskId) {
      router.push(`/results/${recentTaskId}`)
    } else {
      router.push("/results")
    }
  }

  const handleCloseSuccess = () => {
    setSubmitState(feedbackSubmitInitial)
  }

  if (!isAuthed && !guardBypass) {
    return null
  }

  return (
    <div className="space-y-8">
      {pageError && <ErrorBanner message={pageError} onRetry={() => setPageState("default")} />}

      <EligibilityGate eligibility={eligibility} onCreateTask={() => router.push("/start")}>
        <FeedbackForm
          form={formState}
          limits={limits}
          rateLimit={rateLimit}
          submitState={submitState}
          submitting={submitting}
          disabled={isDisabled}
          cooldownRemaining={cooldownRemaining}
          screenshotError={screenshotError}
          emailError={emailError}
          onMessageChange={handleMessageChange}
          onEmailChange={handleEmailChange}
          onAddScreenshots={handleAddScreenshots}
          onRemoveScreenshot={handleRemoveScreenshot}
          onSubmit={handleSubmit}
          onViewResults={handleViewResults}
          onCloseSuccess={handleCloseSuccess}
        />
      </EligibilityGate>

    </div>
  )
}