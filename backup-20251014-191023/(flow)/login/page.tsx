"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { loginMock } from "@/lib/stage1-data"
import { ErrorBanner } from "@/components/stage1/common"
import { useDevAuth, useDevPageState } from "@/components/dev/DevToolbar"
import { getSupabaseBrowserClient } from "@/src/lib/supabaseClient"
import { useAuth } from "@/src/components/AuthProvider"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams?.get("redirect")
  const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : loginMock.redirect.to

  const { state: pageState, setState: setPageState } = useDevPageState("login", "Login", "default")
  const { setAuthState } = useDevAuth()
    const { state: authState, user } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    if (pageState === "error") {
      setError("Sign-in failed. Please try again.")
    } else if (pageState !== "loading") {
      setError(null)
    }
  }, [pageState])

  const loading = pageState === "loading"
  const disabled = pageState === "disabled"

  const handleGoogle = async () => {
    if (loading || disabled || isAuthenticating) return

    setIsAuthenticating(true)
    setPageState("loading")
    setError(null)

    try {
      // DB 模式：使用 Supabase Auth Google OAuth
      const supabase = getSupabaseBrowserClient()
      const redirectTo = process.env.AUTH_REDIRECT_URL || 'http://localhost:3000/auth/callback'

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { prompt: 'select_account' } },
      })
    } catch (err) {
      console.error("Google OAuth error:", err)
      let errorMessage = "Sign-in failed. Please try again."

      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`
        if (err.message.includes('popup')) {
          errorMessage = "Please allow popups for this site to sign in with Google."
        } else if (err.message.includes('network')) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (err.message.includes('OAuth') || err.message.includes('provider')) {
          errorMessage = "Google OAuth not configured in Supabase dashboard. Please configure Google Auth provider."
        }
      }

      setError(errorMessage)
      setPageState("error")
      setIsAuthenticating(false)
    }
  }

  // 检查用户是否已登录，如果已登录则重定向
  useEffect(() => {
    if (authState === 'user' && user) {
      router.replace(redirectTo)
    }
  }, [authState, user, router, redirectTo])

  // 检查是否有认证错误回调
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    if (error && errorDescription) {
      const errorMessage = getGoogleAuthErrorMessage(error, errorDescription)
      setError(errorMessage)
      setPageState("error")

      // 清除URL中的错误参数
      const cleanUrl = window.location.pathname + window.location.search
      const url = new URL(cleanUrl, window.location.origin)
      url.searchParams.delete('error')
      url.searchParams.delete('error_description')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const getGoogleAuthErrorMessage = (error: string, description: string): string => {
    switch (error) {
      case 'access_denied':
        return "Sign-in was cancelled. Please try again if you wish to continue."
      case 'invalid_request':
        return "Invalid sign-in request. Please try again."
      case 'unauthorized_client':
        return "Authentication service unavailable. Please contact support."
      case 'server_error':
        return "Google sign-in service is temporarily unavailable. Please try again later."
      case 'temporarily_unavailable':
        return "Google sign-in service is temporarily unavailable. Please try again later."
      default:
        return description || "Sign-in failed. Please try again."
    }
  }

  const copy = loginMock.copy
  const legal = loginMock.legalLinks

  // 检查是否有认证配置（Supabase Auth 或 Google OAuth）
  const hasSupabaseConfig = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const hasGoogleConfig = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const hasAuthConfig = hasSupabaseConfig || hasGoogleConfig

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-gray-950 to-black px-4 py-16 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/75 p-8 shadow-2xl backdrop-blur">
        <header className="mb-6 space-y-2 text-center">
          <h1 className="text-3xl font-semibold">{copy.headline}</h1>
          <p className="text-sm text-white/60">{copy.subtext}</p>
          {!hasAuthConfig && (
            <p className="text-xs text-yellow-400 mt-2">
              ⚠️ Authentication not configured. Please set up Supabase Auth or Google OAuth.
            </p>
          )}
          {hasSupabaseConfig && (
            <p className="text-xs text-blue-400 mt-2">
              ℹ️ Using Supabase Auth. Make sure Google OAuth is configured in your Supabase dashboard.
            </p>
          )}
        </header>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onRetry={() => setPageState("default")} />
          </div>
        )}

        <button
          type="button"
          className={`flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50 ${isAuthenticating ? 'animate-pulse' : ''}`}
          onClick={handleGoogle}
          disabled={disabled || loading || isAuthenticating || !loginMock.providers.allowGoogle || !hasAuthConfig}
          aria-label="Continue with Google"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs font-bold text-white">G</span>
          {isAuthenticating ? "Connecting to Google..." : loading ? "Signing in..." : "Continue with Google"}
        </button>

        <ul className="mt-6 space-y-2 text-sm text-white/70">
          {copy.highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-white/40">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">{copy.complianceNote}</p>

        <footer className="mt-6 text-center text-xs text-white/40">
          By continuing you agree to our{' '}
          <a href={legal.termsHref} className="text-white/60 hover:text-white">
            Terms
          </a>{' '}
          and{' '}
          <a href={legal.privacyHref} className="text-white/60 hover:text-white">
            Privacy Policy
          </a>
          .
        </footer>

        </div>
    </div>
  )
}
