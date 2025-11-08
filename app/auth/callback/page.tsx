"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // 如果 URL 中包含 code/state，supabase-js 会自动交换 session（detectSessionInUrl=true）
    // 这里等一次 getSession 确认，然后跳转。
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      const redirect = (() => {
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('postAuthRedirect')
          if (stored && stored.startsWith('/')) return stored
          const sp = new URLSearchParams(window.location.search)
          const qp = sp.get('redirect')
          if (qp && qp.startsWith('/')) return qp
        }
        return '/start'
      })()
      if (data.session) router.replace(redirect)
      else router.replace('/login')
    })
    return () => { alive = false }
  }, [router, supabase])

  return <p>Signing you in…</p>
}