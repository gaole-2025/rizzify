// @ts-nocheck
/* eslint-disable */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  NotesBar,
  PreviewDrawer,
  ResultSection,
  SectionNav,
  UploadedSection,
} from "@/components/stage1/results"
import { ErrorBanner, Skeleton } from "@/components/stage1/common"
import { useDevPageState } from "@/components/dev/DevToolbar"
import { writeLastTaskId } from "@/lib/stage2-storage"
import {
  deletePhoto,
  getPhotoDownload,
  getTaskResults,
  getTaskStatus,
  ApiError,
} from "@/lib/api/client"
// import { tasksRepo, photosRepo } from "@/db/repo" // 移除直接导入，使用 API
import type { GenerationSection, ResultCardData, SectionKey, OriginalCard } from "@/lib/stage1-data"
import type { TPlanCode } from "@/lib/api/schema"
import { Plan } from "@prisma/client"

const NOTES = {
  freePolicy: "Free plan files expire in 24 hours with watermark.",
  retention: "Start/Pro keep files for 30 days. Delete removes links immediately.",
  reset: "Daily reset at 02:00 UTC.",
}

interface SectionStateData {
  items: ResultCardData[]
  state: {
    key: SectionKey
    error?: string
    downloadingAll: boolean
    deletingAll: boolean
  }
}

interface PageState {
  uploaded: SectionStateData
  free: SectionStateData
  start: SectionStateData
  pro: SectionStateData
}

interface PreviewState {
  open: boolean
  section: GenerationSection
  index: number
}

const SECTION_ORDER: SectionKey[] = ["uploaded", "free", "start", "pro"]

function createInitialState(): PageState {
  return {
    uploaded: { items: [], state: { key: "uploaded", downloadingAll: false, deletingAll: false } },
    free: { items: [], state: { key: "free", downloadingAll: false, deletingAll: false } },
    start: { items: [], state: { key: "start", downloadingAll: false, deletingAll: false } },
    pro: { items: [], state: { key: "pro", downloadingAll: false, deletingAll: false } },
  }
}

function buildStateFromResults(plan: TPlanCode, data: Awaited<ReturnType<typeof getTaskResults>>): PageState {
  return {
    uploaded: {
      items: data.uploaded as ResultCardData[], // Cast to expected type
      state: { key: "uploaded", downloadingAll: false, deletingAll: false },
    },
    free: {
      items: data.free.map(item => ({
        id: item.id,
        url: item.url,
        section: "free" as GenerationSection,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      })),
      state: { key: "free", downloadingAll: false, deletingAll: false },
    },
    start: {
      items: data.start.map(item => ({
        id: item.id,
        url: item.url,
        section: "start" as GenerationSection,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      })),
      state: { key: "start", downloadingAll: false, deletingAll: false },
    },
    pro: {
      items: data.pro.map(item => ({
        id: item.id,
        url: item.url,
        section: "pro" as GenerationSection,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      })),
      state: { key: "pro", downloadingAll: false, deletingAll: false },
    },
  }
}

function buildStateFromDbData(plan: Plan, data: any): PageState {
  return {
    uploaded: {
      items: data.uploaded?.map((item: any) => ({
        id: item.id,
        url: item.url,
        section: "uploaded" as GenerationSection,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      })) || [],
      state: { key: "uploaded", downloadingAll: false, deletingAll: false },
    },
    free: {
      items: data.free?.map((item: any) => ({
        id: item.id,
        url: item.url,
        section: "free" as GenerationSection,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      })) || [],
      state: { key: "free", downloadingAll: false, deletingAll: false },
    },
    start: {
      items: data.start?.map((item: any) => ({
        id: item.id,
        url: item.url,
        section: "start" as GenerationSection,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      })) || [],
      state: { key: "start", downloadingAll: false, deletingAll: false },
    },
    pro: {
      items: data.pro?.map((item: any) => ({
        id: item.id,
        url: item.url,
        section: "pro" as GenerationSection,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      })) || [],
      state: { key: "pro", downloadingAll: false, deletingAll: false },
    },
  }
}

export default function ResultsPage() {
  const params = useParams<{ taskId: string }>()
  const router = useRouter()
  const taskId = params?.taskId
  const { state: pageState } = useDevPageState("results", "Results", "default")
  
  const [sections, setSections] = useState<PageState>(createInitialState())
  const [taskPlan, setTaskPlan] = useState<TPlanCode | null>(null)
  const [status, setStatus] = useState<"queued" | "running" | "done" | "error" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<PreviewState>({ open: false, section: "free", index: 0 })
  const actionsDisabled = pageState === "disabled"

  const notes = useMemo(() => NOTES, [])

  const pollStatus = useCallback(async () => {
    console.log('🔍 [Results] pollStatus called, taskId:', taskId)
    // DB 模式：使用 API 获取任务状态
    try {
      console.log('📡 [Results] Fetching task status from DB mode...')
      const response = await fetch(`/api/tasks/${taskId}`, { cache: 'no-store' })
      console.log('📡 [Results] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[tasks] status=', response.status, errorText)
        if (response.status === 404) {
          console.log('❌ [Results] Task not found')
          setError("Task not found")
          setStatus("error")
          return "error"
        }
        throw new Error('Failed to fetch task status')
      }

      const data = await response.json()
      console.log('✅ [Results] Task status data:', data)

      // 修复：API返回的数据结构中，status字段直接在data根级别，不是data.task.status
      setStatus(data.status as "queued" | "running" | "done" | "error")

      if (data.status === "error") {
        setError(data.errorMessage || "Task failed")
      }
      return data.status as "queued" | "running" | "done" | "error"
    } catch (err) {
      console.error('❌ [Results] Error in pollStatus (DB mode):', err)
      setError("Failed to load task status from database.")
      setStatus("error")
      return "error"
    }
  }, [taskId])

  // 🚀 优化：添加渐进式加载结果数据的函数
  const loadResults = useCallback(async () => {
    console.log('📊 [Results] loadResults called, taskId:', taskId)
    // DB 模式：使用 API 获取结果
    try {
      console.log('📡 [Results] Fetching results from DB mode...')
      // 🚀 优化：使用缓存策略，不再设置 cache: 'no-store'
      const response = await fetch(`/api/tasks/${taskId}/results`)
      console.log('📡 [Results] Results response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[results] status=', response.status, errorText)
        if (response.status === 404) {
          console.log('❌ [Results] Results not found')
          setError("Task not found")
          setLoading(false)
          return
        }
        throw new Error('Failed to fetch task results')
      }

      const data = await response.json()
      console.log('✅ [Results] Results data received:', data)
      setTaskPlan(data.task.plan as TPlanCode)

      // 🚀 优化：立即显示基础信息，渐进式加载图片
      const apiData = {
        task: data.task || { id: '', createdAt: '', plan: 'free' as const, total: 0 },
        uploaded: data.uploaded || [],
        free: data.free || [],
        start: data.start || [],
        pro: data.pro || []
      }
      console.log('🔧 [Results] Building state from API data:', apiData)

      const newState = buildStateFromResults(data.task.plan as TPlanCode, apiData as any)
      console.log('🏗️ [Results] New state built:', newState)

      // 🚀 优化：立即设置数据，提升感知性能
      setSections(newState)
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('❌ [Results] Error in loadResults (DB mode):', err)
      setError("Failed to load results from database.")
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      const currentStatus = await pollStatus()
      if (cancelled) return

      if (currentStatus === "done") {
        await loadResults()
      } else if (currentStatus === "error") {
        setLoading(false)
      } else {
        const timer = setInterval(async () => {
          const next = await pollStatus()
          if (cancelled) {
            clearInterval(timer)
            return
          }
          if (next === "done") {
            clearInterval(timer)
            await loadResults()
          }
          if (next === "error") {
            clearInterval(timer)
            setLoading(false)
          }
        }, 1500)
        return () => clearInterval(timer)
      }
    }

    const disposer = run()
    return () => {
      cancelled = true
      if (typeof disposer === "function") {
        disposer()
      }
    }
  }, [loadResults, pollStatus, taskId])

  const handleDownloadAll = async (section: SectionKey) => {
    const items = sections[section].items
    if (items.length === 0) return
    setSections((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        state: { ...prev[section].state, downloadingAll: true },
      },
    }))
    try {
      for (const item of items) {
        // DB 模式：暂时使用 objectKey 作为 URL
        const link = { url: item.url, filename: `${taskId}_${section}_${Date.now()}.jpg` }
        const anchor = document.createElement("a")
        anchor.href = link.url
        anchor.download = link.filename
        anchor.rel = "noopener"
        anchor.target = "_blank"
        anchor.click()
      }
    } catch (err) {
      let message = "Failed to download photos."

      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.status === 400) {
          if (err.code === 'invalid_photos') {
            message = "Some photos are no longer available for download."
          } else if (err.code === 'download_limit_exceeded') {
            message = "Download limit exceeded. Please try again later."
          } else if (err.code?.startsWith('invalid_')) {
            message = `Download error: ${err.message || 'Invalid download request. Please try again.'}`
          } else {
            message = err.message || "Failed to download photos."
          }
        } else if (err.status === 403) {
          message = "Download permission denied. Photos may have expired."
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 60
          message = `Too many download requests. Please wait ${retryAfter} seconds before trying again.`
        } else if (err.status === 503) {
          message = "Download service temporarily unavailable. Please try again in a few minutes."
        } else {
          message = err.message || "Failed to download photos."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          state: { ...prev[section].state, error: message },
        },
      }))
    } finally {
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          state: { ...prev[section].state, downloadingAll: false },
        },
      }))
    }
  }

  const handleDeleteAll = async (section: SectionKey) => {
    const items = sections[section].items
    if (items.length === 0) return
    setSections((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        state: { ...prev[section].state, deletingAll: true },
      },
    }))
    try {
      for (const item of items) {
        // DB 模式：暂时不支持删除功能（需要创建 API 路由）
        console.warn('Photo deletion not yet implemented in DB mode')
        // TODO: 创建 /api/photos/[id] DELETE 路由
      }
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          items: [],
          state: { ...prev[section].state, deletingAll: false },
        },
      }))
    } catch (err) {
      let message = "Failed to delete photos."

      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.status === 400) {
          if (err.code === 'invalid_photos') {
            message = "Some photos are no longer available for deletion."
          } else if (err.code === 'delete_permission_denied') {
            message = "Permission denied. You cannot delete these photos."
          } else if (err.code?.startsWith('invalid_')) {
            message = `Delete error: ${err.message || 'Invalid delete request. Please try again.'}`
          } else {
            message = err.message || "Failed to delete photos."
          }
        } else if (err.status === 403) {
          message = "Delete permission denied. You can only delete your own photos."
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 30
          message = `Too many delete requests. Please wait ${retryAfter} seconds before trying again.`
        } else if (err.status === 503) {
          message = "Delete service temporarily unavailable. Please try again in a few minutes."
        } else {
          message = err.message || "Failed to delete photos."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          state: { ...prev[section].state, deletingAll: false, error: message },
        },
      }))
    }
  }

  const handleSelect = (section: GenerationSection, index: number) => {
    setPreview({ open: true, section, index })
  }

  const handleDeleteSingle = async (section: GenerationSection, index: number) => {
    const item = sections[section].items[index]
    if (!item) return
    try {
      // DB 模式：暂时不支持删除功能（需要创建 API 路由）
      console.warn('Photo deletion not yet implemented in DB mode')
      // TODO: 创建 /api/photos/[id] DELETE 路由
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          items: prev[section].items.filter((_, idx) => idx !== index),
        },
      }))
      setPreview((prevState) => {
        if (!prevState.open) return prevState
        if (prevState.section !== section) return prevState
        const remaining = sections[section].items.length - 1
        if (remaining <= 0) {
          return { open: false, section: prevState.section, index: 0 }
        }
        const nextIndex = Math.min(prevState.index, remaining - 1)
        return { ...prevState, index: nextIndex }
      })
    } catch (err) {
      let message = "Failed to delete photo."

      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.status === 400) {
          if (err.code === 'invalid_photo') {
            message = "Photo is no longer available for deletion."
          } else if (err.code === 'delete_permission_denied') {
            message = "Permission denied. You cannot delete this photo."
          } else if (err.code?.startsWith('invalid_')) {
            message = `Delete error: ${err.message || 'Invalid delete request. Please try again.'}`
          } else {
            message = err.message || "Failed to delete photo."
          }
        } else if (err.status === 403) {
          message = "Delete permission denied. You can only delete your own photos."
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 15
          message = `Too many delete requests. Please wait ${retryAfter} seconds before trying again.`
        } else if (err.status === 503) {
          message = "Delete service temporarily unavailable. Please try again in a few minutes."
        } else {
          message = err.message || "Failed to delete photo."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setError(message)
    }
  }

  const handleDownloadSingle = async (section: GenerationSection, index: number) => {
    const item = sections[section].items[index]
    if (!item) return
    try {
      // DB 模式：暂时使用 objectKey 作为 URL
      const link = { url: item.url, filename: `${taskId}_${section}_${Date.now()}.jpg` }
      const anchor = document.createElement("a")
      anchor.href = link.url
      anchor.download = link.filename
      anchor.rel = "noopener"
      anchor.target = "_blank"
      anchor.click()
    } catch (err) {
      let message = "Failed to download photo."

      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.status === 400) {
          if (err.code === 'invalid_photo') {
            message = "Photo is no longer available for download."
          } else if (err.code === 'download_limit_exceeded') {
            message = "Download limit exceeded. Please try again later."
          } else if (err.code?.startsWith('invalid_')) {
            message = `Download error: ${err.message || 'Invalid download request. Please try again.'}`
          } else {
            message = err.message || "Failed to download photo."
          }
        } else if (err.status === 403) {
          message = "Download permission denied. Photo may have expired."
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 30
          message = `Too many download requests. Please wait ${retryAfter} seconds before trying again.`
        } else if (err.status === 503) {
          message = "Download service temporarily unavailable. Please try again in a few minutes."
        } else {
          message = err.message || "Failed to download photo."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setError(message)
    }
  }

  const sectionCounts = useMemo(() => ({
    uploaded: sections.uploaded.items.length,
    free: sections.free.items.length,
    start: sections.start.items.length,
    pro: sections.pro.items.length,
  }), [sections])

  const handleClosePreview = () => setPreview((prevState) => ({ ...prevState, open: false }))

  const handlePrevPreview = () => {
    setPreview((prevState) => {
      const items = sections[prevState.section].items
      if (items.length === 0) return { open: false, section: prevState.section, index: 0 }
      const nextIndex = (prevState.index - 1 + items.length) % items.length
      return { ...prevState, index: nextIndex }
    })
  }

  const handleNextPreview = () => {
    setPreview((prevState) => {
      const items = sections[prevState.section].items
      if (items.length === 0) return { open: false, section: prevState.section, index: 0 }
      const nextIndex = (prevState.index + 1) % items.length
      return { ...prevState, index: nextIndex }
    })
  }

  // 🚀 优化：改进的加载状态，提供更好的用户体验
  if (loading) {
    return (
      <div className="space-y-6">
        {/* 任务信息骨架屏 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6 space-y-2">
            <div className="h-8 w-32 rounded-lg bg-white/10 animate-pulse"></div>
            <div className="h-4 w-48 rounded-lg bg-white/5 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 w-12 rounded-lg bg-white/5 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* 上传照片骨架屏 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 h-6 w-24 rounded-lg bg-white/10 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/10 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* 结果区域骨架屏 */}
        {['Free Plan', 'Start Plan', 'Pro Plan'].map((plan, index) => (
          <div key={plan} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-32 rounded-lg bg-white/10 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse"></div>
                <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: index + 1 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white/10 animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center text-white/50 text-sm animate-pulse">
          Loading your AI generated images...
        </div>
      </div>
    )
  }

  if (error && error === "Task not found") {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-white">Task Not Found</h1>
          <p className="text-white/70">
            The requested task could not be found. Please check the task ID and try again.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white hover:bg-white/20"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <header className="mb-6 space-y-2 text-white">
          <h1 className="text-2xl font-semibold">Task #{taskId}</h1>
          <p className="text-xs text-white/60">
            {sectionCounts.free + sectionCounts.start + sectionCounts.pro} photos ready - Plan: {taskPlan ?? "-"}
          </p>
        </header>
        <SectionNav counts={sectionCounts} />
        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} onRetry={loadResults} />
          </div>
        )}
      </section>

      <UploadedSection
        items={sections.uploaded.items.map((item) => ({
          id: item.id,
          url: item.url,
          createdAt: item.createdAt
        } as OriginalCard))}
        state={sections.uploaded.state}
        disabled={actionsDisabled}
        onDownloadAll={() => handleDownloadAll("uploaded")}
        onDeleteAll={() => handleDeleteAll("uploaded")}
      />

      <ResultSection
        section="free"
        data={sections.free.items}
        state={sections.free.state}
        disabled={actionsDisabled}
        error={sections.free.state.error}
        onSelect={(index) => handleSelect("free", index)}
        onDownloadAll={() => handleDownloadAll("free")}
        onDeleteAll={() => handleDeleteAll("free")}
      />

      <ResultSection
        section="start"
        data={sections.start.items}
        state={sections.start.state}
        disabled={actionsDisabled}
        error={sections.start.state.error}
        onSelect={(index) => handleSelect("start", index)}
        onDownloadAll={() => handleDownloadAll("start")}
        onDeleteAll={() => handleDeleteAll("start")}
      />

      <ResultSection
        section="pro"
        data={sections.pro.items}
        state={sections.pro.state}
        disabled={actionsDisabled}
        error={sections.pro.state.error}
        onSelect={(index) => handleSelect("pro", index)}
        onDownloadAll={() => handleDownloadAll("pro")}
        onDeleteAll={() => handleDeleteAll("pro")}
      />

      <NotesBar notes={notes} />

      <PreviewDrawer
        open={preview.open}
        section={preview.section}
        taskId={taskId}
        cards={sections[preview.section].items}
        index={preview.index}
        onClose={handleClosePreview}
        onPrev={handlePrevPreview}
        onNext={handleNextPreview}
        onDelete={(idx) => handleDeleteSingle(preview.section, idx)}
        onDownload={(idx) => handleDownloadSingle(preview.section, idx)}
        onCopyLink={(idx) => handleDownloadSingle(preview.section, idx)}
      />
    </div>
  )
}