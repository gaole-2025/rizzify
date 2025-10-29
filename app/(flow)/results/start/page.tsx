"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Trash2 } from "lucide-react"
import { ErrorBanner, Skeleton } from "@/components/stage1/common"
import { getSupabaseBrowserClient } from "@/src/lib/supabaseClient"
import type { ResultCardData } from "@/lib/stage1-data"

// 🚀 Start套餐专用分页数据接口
interface StartResultsData {
  photos: ResultCardData[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
    totalPages: number
    currentPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  stats: {
    totalPhotos: number
    currentPagePhotos: number
    remainingPhotos: number
  }
}

export default function StartResultsPage() {
  const router = useRouter()

  const [photos, setPhotos] = useState<ResultCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // 🚀 加载Start套餐结果的函数
  const loadStartResults = useCallback(async (page: number = 1) => {
    console.log('📊 [Start Results] loadStartResults called, page:', page)
    try {
      setLoading(true)
      console.log('📡 [Start Results] Fetching Start results from API...')

      // 🚀 添加认证token到请求
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/user/results/start?page=${page}&limit=20`, {
        headers,
        credentials: 'include'
      })
      console.log('📡 [Start Results] Start results response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[start-results] status=', response.status, errorText)

        if (response.status === 401) {
          console.log('❌ [Start Results] User not authenticated')
          setError("Please log in to view your results")
          setLoading(false)
          router.push('/')
          return
        }

        throw new Error('Failed to fetch Start results')
      }

      const data: StartResultsData = await response.json()
      console.log('✅ [Start Results] Start results data received:', data)

      // 更新照片数据
      if (page === 1) {
        setPhotos(data.photos)
      } else {
        // 分页加载，追加数据
        setPhotos(prev => [...prev, ...data.photos])
      }

      // 更新分页信息
      setPagination(data.pagination)
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('❌ [Start Results] Error in loadStartResults:', err)
      setError("Failed to load your Start results.")
      setLoading(false)
    }
  }, [router])

  // 🚀 加载更多结果的函数
  const loadMoreResults = useCallback(() => {
    if (pagination.hasNextPage && !loading) {
      const nextPage = pagination.page + 1
      loadStartResults(nextPage)
    }
  }, [pagination.hasNextPage, pagination.page, loading, loadStartResults])

  // 页面加载时获取数据
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      if (!cancelled) {
        await loadStartResults(1)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [loadStartResults])

  const handleDownloadAll = async () => {
    if (photos.length === 0) return

    try {
      for (const photo of photos) {
        const link = { url: photo.url, filename: `rizzify_start_${photo.id}.jpg` }
        const anchor = document.createElement("a")
        anchor.href = link.url
        anchor.download = link.filename
        anchor.rel = "noopener"
        anchor.target = "_blank"
        anchor.click()

        // 添加小延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (err) {
      console.error('Download all error:', err)
      setError("Failed to download photos")
    }
  }

  const handleDownloadSingle = async (photo: ResultCardData) => {
    try {
      const link = { url: photo.url, filename: `rizzify_start_${photo.id}.jpg` }
      const anchor = document.createElement("a")
      anchor.href = link.url
      anchor.download = link.filename
      anchor.rel = "noopener"
      anchor.target = "_blank"
      anchor.click()
    } catch (err) {
      console.error('Download error:', err)
      setError("Failed to download photo")
    }
  }

  const handleDeleteSingle = async (photo: ResultCardData) => {
    // 🚀 添加删除确认
    const confirmMessage = `Are you sure you want to delete this Start plan photo? This action cannot be undone.`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      console.log(`🗑️ [Start Results] Starting deletion of photo ${photo.id}`)

      // 🚀 调用单个删除API
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete photo (${response.status})`)
      }

      const result = await response.json()
      console.log('✅ [Start Results] Photo deletion started:', result)

      // 🚀 立即更新前端状态（乐观更新）
      setPhotos(prev => prev.filter(p => p.id !== photo.id))

      // 🚀 更新分页信息
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }))

      console.log(`🎉 [Start Results] Started deletion of photo ${photo.id}`)

    } catch (err) {
      console.error('❌ [Start Results] Photo deletion error:', err)
      const message = err instanceof Error ? err.message : "Failed to delete photo"
      setError(message)
    }
  }

  // 🚀 加载状态
  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* 返回按钮骨架屏 */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-24 rounded-lg bg-white/10 animate-pulse"></div>
              <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse"></div>
            </div>
          </div>

          {/* 统计信息骨架屏 */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-8 w-8 mx-auto rounded-lg bg-white/10 animate-pulse mb-2"></div>
                  <div className="h-4 w-16 mx-auto rounded-lg bg-white/5 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 照片网格骨架屏 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/10 animate-pulse"></div>
            ))}
          </div>

          <div className="text-center text-white/50 text-sm animate-pulse mt-8">
            Loading your Start plan gallery...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 🚀 头部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/results')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Gallery</span>
            </button>
            <div className="text-white">
              <h1 className="text-2xl font-bold">Start Plan Results</h1>
              <p className="text-white/60 text-sm">
                {pagination.total} photos total • Page {pagination.currentPage} of {pagination.totalPages}
              </p>
            </div>
          </div>

          {photos.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <Download size={16} />
              Download All
            </button>
          )}
        </div>

        {/* 🚀 统计信息 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <div className="text-2xl font-bold">{pagination.total}</div>
              <div className="text-xs text-white/50">Total Photos</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{photos.length}</div>
              <div className="text-xs text-white/50">Showing Now</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.max(0, pagination.total - photos.length)}</div>
              <div className="text-xs text-white/50">Remaining</div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
            <ErrorBanner message={error} onRetry={() => loadStartResults(1)} />
          </div>
        )}

        {/* 🚀 照片网格 */}
        {photos.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                    <img
                      src={photo.url}
                      alt="Start plan result"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* 悬停操作按钮 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleDownloadSingle(photo)}
                      className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                      title="Download photo"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSingle(photo)}
                      className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* 照片信息 */}
                  <div className="mt-2 text-xs text-white/50 text-center">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            {/* 🚀 分页控制 */}
            <div className="flex justify-center gap-4">
              {pagination.hasPreviousPage && (
                <button
                  onClick={() => loadStartResults(pagination.currentPage - 1)}
                  disabled={loading}
                  className="px-6 py-3 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous Page
                </button>
              )}

              <div className="flex items-center px-4 text-white/70">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>

              {pagination.hasNextPage && (
                <button
                  onClick={loadMoreResults}
                  disabled={loading}
                  className="px-6 py-3 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Next Page'}
                </button>
              )}
            </div>
          </>
        ) : (
          !loading && (
            <div className="text-center py-12 text-white/50">
              <div className="text-lg mb-2">No Start plan photos yet</div>
              <div className="text-sm">Generate some AI photos to see them here!</div>
            </div>
          )
        )}
      </div>
    </div>
  )
}