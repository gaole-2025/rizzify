"use client"

import { useState, useCallback, useEffect } from "react"
import { Download, Trash2, X } from "lucide-react"
import type { ResultCardData } from "@/lib/stage1-data"
import { getSupabaseBrowserClient } from "@/src/lib/supabaseClient"

interface ProPlanPaginationProps {
  initialPhotos: ResultCardData[]
  totalPhotos: number
  hasMore: boolean
  onPhotoDelete?: (photoId: string) => void
}

interface DeleteConfirmState {
  isOpen: boolean
  photoId: string | null
  isLoading: boolean
}

function DeleteConfirmDialog({
  isOpen,
  photoId,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean
  photoId: string | null
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading: boolean
}) {
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

export default function ProPlanPagination({
  initialPhotos,
  totalPhotos,
  hasMore,
  onPhotoDelete,
}: ProPlanPaginationProps) {
  const [photos, setPhotos] = useState<ResultCardData[]>(initialPhotos)
  const [page, setPage] = useState(1)  // 当前已加载的页数（初始已加载第1页）
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 🐛 修复：防止 initialPhotos 改变时重置 photos
  useEffect(() => {
    if (initialPhotos.length > 0 && photos.length === 0) {
      setPhotos(initialPhotos)
    }
  }, [initialPhotos])
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    photoId: null,
    isLoading: false,
  })

  const loadMorePhotos = useCallback(async () => {
    console.log(`📄 Load More: 当前 page=${page}, 将请求 page=${page + 1}`)
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const nextPage = page + 1
      console.log(`🔍 请求: /api/user/results/pro?page=${nextPage}&limit=20`)
      const response = await fetch(
        `/api/user/results/pro?page=${nextPage}&limit=20`,
        { headers, credentials: "include" }
      )

      if (!response.ok) {
        throw new Error("Failed to load more photos")
      }

      const data = await response.json()
      console.log(`✅ 收到 ${data.photos.length} 张照片，更新 page 为 ${nextPage}`)
      setPhotos((prev) => [...prev, ...data.photos])
      setPage(nextPage)
      setError(null)
    } catch (err) {
      console.error("Error loading more photos:", err)
      setError("Failed to load more photos")
    } finally {
      setLoading(false)
    }
  }, [page])

  const handleDownload = async (photo: ResultCardData) => {
    try {
      const link = document.createElement("a")
      link.href = photo.url
      link.download = `rizzify_pro_${photo.id}.jpg`
      link.rel = "noopener"
      link.target = "_blank"
      link.click()
    } catch (err) {
      console.error("Download error:", err)
      setError("Failed to download photo")
    }
  }

  const handleDeleteClick = (photoId: string) => {
    setDeleteConfirm({ isOpen: true, photoId, isLoading: false })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.photoId) return

    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }))

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/photos/${deleteConfirm.photoId}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete photo")
      }

      // Remove photo from list
      setPhotos((prev) =>
        prev.filter((p) => p.id !== deleteConfirm.photoId)
      )

      // Call parent callback if provided
      if (onPhotoDelete) {
        onPhotoDelete(deleteConfirm.photoId)
      }

      setDeleteConfirm({ isOpen: false, photoId: null, isLoading: false })
      setError(null)
    } catch (err) {
      console.error("Delete error:", err)
      setError("Failed to delete photo")
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, photoId: null, isLoading: false })
  }

  return (
    <div className="space-y-4">
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        photoId={deleteConfirm.photoId}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteConfirm.isLoading}
      />

      {/* Photo Grid */}
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

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center gap-2">
              <button
                onClick={() => handleDownload(photo)}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Download photo"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => handleDeleteClick(photo.id)}
                className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Delete photo"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Photo Info */}
            <div className="mt-2 text-xs text-white/50 text-center">
              {new Date(photo.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Pagination Controls */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMorePhotos}
            disabled={loading}
            className="px-6 py-3 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : `Load More (${photos.length}/${totalPhotos})`}
          </button>
        </div>
      )}

      {/* Stats */}
      {!hasMore && photos.length > 0 && (
        <div className="text-center text-white/50 text-sm py-4">
          Showing all {photos.length} Pro plan photos
        </div>
      )}
    </div>
  )
}
