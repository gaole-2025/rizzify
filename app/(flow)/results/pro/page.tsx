"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Trash2, X } from "lucide-react"
import { ErrorBanner, Skeleton } from "@/components/stage1/common"
import { getSupabaseBrowserClient } from "@/src/lib/supabaseClient"
import type { ResultCardData } from "@/lib/stage1-data"

// 删除确认对话框组件
interface DeleteConfirmDialogProps {
  isOpen: boolean
  photoId: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function DeleteConfirmDialog({ isOpen, photoId, onConfirm, onCancel, isLoading }: DeleteConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 rounded-2xl border border-white/20 p-6 max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Delete Photo</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-white/70 mb-6">
          Are you sure you want to delete this photo? This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 🚀 Pro套餐专用分页数据接口
interface ProResultsData {
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

export default function ProResultsPage() {
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; photoId: string | null; isLoading: boolean }>({
    isOpen: false,
    photoId: null,
    isLoading: false
  })

  // 🚀 加载Pro套餐结果的函数
  const loadProResults = useCallback(async (page: number = 1) => {
    console.log('📊 [Pro Results] loadProResults called, page:', page)
    try {
      setLoading(true)
      console.log('📡 [Pro Results] Fetching Pro results from API...')

      // 🚀 添加认证token到请求
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/user/results/pro?page=${page}&limit=20`, {
        headers,
        credentials: 'include'
      })
      console.log('📡 [Pro Results] Pro results response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[pro-results] status=', response.status, errorText)

        if (response.status === 401) {
          console.log('❌ [Pro Results] User not authenticated')
          setError("Please log in to view your results")
          setLoading(false)
          router.push('/')
          return
        }

        throw new Error('Failed to fetch Pro results')
      }

      const data: ProResultsData = await response.json()
      console.log('✅ [Pro Results] Pro results data received:', data)

      // 🚀 修复分页逻辑：每次加载新页面时替换照片列表（不追加）
      setPhotos(data.photos)

      // 更新分页信息
      setPagination(data.pagination)
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('❌ [Pro Results] Error in loadProResults:', err)
      setError("Failed to load your Pro results.")
      setLoading(false)
    }
  }, [router])

  // 🚀 加载更多结果的函数
  const loadMoreResults = useCallback(() => {
    if (pagination.hasNextPage && !loading) {
      const nextPage = pagination.page + 1
      loadProResults(nextPage)
    }
  }, [pagination.hasNextPage, pagination.page, loading, loadProResults])

  // 页面加载时获取数据
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      if (!cancelled) {
        await loadProResults(1)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [loadProResults])

  const handleDownloadAll = async () => {
    if (photos.length === 0) return

    try {
      for (const photo of photos) {
        const link = { url: photo.url, filename: `rizzify_pro_${photo.id}.jpg` }
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
      const link = { url: photo.url, filename: `rizzify_pro_${photo.id}.jpg` }
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
    // 打开删除确认对话框
    setDeleteConfirm({ isOpen: true, photoId: photo.id, isLoading: false })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.photoId) return

    setDeleteConfirm(prev => ({ ...prev, isLoading: true }))

    try {
      console.log(`🗑️ [Pro Results] Starting deletion of photo ${deleteConfirm.photoId}`)

      // 🚀 调用单个删除API
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/photos/${deleteConfirm.photoId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete photo (${response.status})`)
      }

      const result = await response.json()
      console.log('✅ [Pro Results] Photo deletion started:', result)

      // 🚀 立即更新前端状态（乐观更新）
      setPhotos(prev => prev.filter(p => p.id !== deleteConfirm.photoId))

      // 🚀 更新分页信息
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }))

      console.log(`🎉 [Pro Results] Started deletion of photo ${deleteConfirm.photoId}`)

      // 🚀 关闭对话框
      setDeleteConfirm({ isOpen: false, photoId: null, isLoading: false })

    } catch (err) {
      console.error('❌ [Pro Results] Photo deletion error:', err)
      const message = err instanceof Error ? err.message : "Failed to delete photo"
      setError(message)
      setDeleteConfirm(prev => ({ ...prev, isLoading: false }))
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, photoId: null, isLoading: false })
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
            Loading your Pro plan gallery...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        photoId={deleteConfirm.photoId || ''}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteConfirm.isLoading}
      />

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
              <h1 className="text-2xl font-bold">Pro Plan Results</h1>
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
            <ErrorBanner message={error} onRetry={() => loadProResults(1)} />
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
                      alt="Pro plan result"
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
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-4">
                {pagination.hasPreviousPage && (
                  <button
                    onClick={() => loadProResults(pagination.currentPage - 1)}
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
            )}
          </>
        ) : (
          !loading && (
            <div className="text-center py-12 text-white/50">
              <div className="text-lg mb-2">No Pro plan photos yet</div>
              <div className="text-sm">Generate some AI photos to see them here!</div>
            </div>
          )
        )}
      </div>
    </div>
  )
}