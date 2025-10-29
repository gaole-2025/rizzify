/**
 * Supabase认证Hook
 * 提供Supabase客户端和认证状态管理
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

interface User {
  id: string
  email?: string
  name?: string
  plan?: 'free' | 'start' | 'pro'
  created_at?: string
}

interface SupabaseAuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  supabase: ReturnType<typeof createClient<Database>>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 创建Supabase客户端
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 同步用户到本地数据库
  const syncUserToDatabase = async (supabaseUser: any) => {
    try {
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync user');
      }

      const data = await response.json();
      console.log('✅ User synced to database:', data.user);
      return data.user;
    } catch (error) {
      console.error('Error syncing user to database:', error);
      // 不抛出错误，允许用户继续使用基本功能
      return null;
    }
  };

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      if (user) {
        // 同步用户到本地数据库
        await syncUserToDatabase(user);

        setUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          plan: 'free', // 默认free plan，可以从metadata或其他地方获取
          created_at: user.created_at
        })
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Error refreshing user:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Google登录
  const signInWithGoogle = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `http://localhost:3000/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Error signing in with Google:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    }
  }

  // 登出
  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      // 不自动跳转，让调用方处理跳转逻辑
    } catch (err) {
      console.error('Error signing out:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign out')
    }
  }

  // 监听认证状态变化
  useEffect(() => {
    // 获取初始用户
    refreshUser()

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)

      if (event === 'SIGNED_IN' && session?.user) {
        // 用户登录，确保在本地数据库中有记录
        console.log('👤 User signed in, syncing to database...')
        await refreshUser()
      } else if (event === 'SIGNED_OUT') {
        // 用户登出
        console.log('👋 User signed out')
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const value: SupabaseAuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    refreshUser,
    supabase
  }

  return React.createElement(
    SupabaseAuthContext.Provider,
    { value },
    children
  )
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  }
  return context
}

/**
 * 与DevToolbar集成的认证Hook
 */
export function useDevAuth() {
  const { user, loading, error } = useSupabaseAuth()

  // 为DevToolbar提供兼容的接口
  // 修复：在加载期间不返回 'guest'，避免过早重定向
  const authState = user ? 'user' : 'guest'
  const guardBypass = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true'

  console.log('🔍 useDevAuth state:', { authState, loading, userEmail: user?.email })

  return {
    enabled: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true',
    authState: authState as 'guest' | 'user',
    setAuthState: () => {}, // 在真实认证模式下不允许通过DevToolbar修改
    guardBypass,
    setGuardBypass: () => {}, // 在真实认证模式下不允许通过DevToolbar修改
    user,
    loading,
    error
  }
}