'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

type AuthState = 'loading' | 'guest' | 'user'
type Ctx = { state: AuthState; user: any | null; signOut: () => Promise<void> }

const AuthCtx = createContext<Ctx>({ state: 'loading', user: null, signOut: async () => {} })

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient()
  const [user, setUser] = useState<any | null>(null)
  const [state, setState] = useState<AuthState>('loading')

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      setUser(null)
      setState('guest')

      // 清除上传相关的sessionStorage数据
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('rizzify.stage1.gender')
        window.sessionStorage.removeItem('rizzify.stage1.file')
        window.sessionStorage.removeItem('rizzify.stage2.upload')
      }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  useEffect(() => {
    let mounted = true
    // 初始会话
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const u = data.session?.user ?? null
      setUser(u)
      setState(u ? 'user' : 'guest')
    })
    // 监听状态变化（登录、刷新、登出）
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setState(u ? 'user' : 'guest')
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [supabase])

  const value = useMemo(() => ({ state, user, signOut }), [state, user, signOut])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(){ return useContext(AuthCtx) }