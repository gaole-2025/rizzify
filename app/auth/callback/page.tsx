"use client"
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const sp = useSearchParams()
  const redirect = sp.get('redirect') || '/start'

  useEffect(() => {
    // 如果 URL 中包含 code/state，supabase-js 会自动交换 session（detectSessionInUrl=true）
    // 这里等一次 getSession 确认，然后跳转。
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      if (data.session) router.replace(redirect)
      else router.replace('/login')
    })
    return () => { alive = false }
  }, [router, supabase, redirect])

  return <p>Signing you in…</p>
}