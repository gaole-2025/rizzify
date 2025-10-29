"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/components/AuthProvider"

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { state: authState, user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return

    try {
      setIsSigningOut(true)
      setOpen(false)

      // 调用Supabase登出
      await signOut()

      // 重定向到首页
      router.push('/')
    } catch (error) {
      console.error("Sign out error:", error)
      // 即使出错也关闭菜单
      setOpen(false)
    } finally {
      setIsSigningOut(false)
    }
  }

  // 如果用户未认证，显示登录按钮
  if (authState !== 'user' || !user) {
    return (
      <Link
        href="/login"
        className="btn-primary px-4 py-2 text-sm"
      >
        Sign In
      </Link>
    )
  }

  // 获取用户显示名称
  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'User'

  return (
    <div className="relative z-50">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 transition hover:border-white/40 hover:text-white cursor-pointer relative z-50"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        disabled={isSigningOut}
        style={{ pointerEvents: 'auto' }}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline truncate max-w-20">{displayName}</span>
        {isSigningOut && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </button>
      {open && !isSigningOut && (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-2 w-48 rounded-xl border border-white/10 bg-black/85 p-3 text-sm text-white/70 shadow-lg backdrop-blur"
          style={{ pointerEvents: 'auto' }}
        >
          <ul className="space-y-2">
            <li className="border-b border-white/10 pb-2 mb-2">
              <div className="px-3 py-2">
                <p className="text-xs text-white/50">Signed in as</p>
                <p className="text-sm text-white font-medium truncate">{user.email}</p>
              </div>
            </li>
            <li>
              <Link
                href="/results"
                className="block rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                📸 My Results
              </Link>
            </li>
            <li>
              <Link
                href="/feedback"
                className="block rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                💬 Feedback
              </Link>
            </li>
            <li className="border-t border-white/10 pt-2">
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                role="menuitem"
                onClick={handleSignOut}
              >
                🚪 Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}