// 单例 Browser 客户端（App Router 客户端组件使用）
import { createClient } from '@supabase/supabase-js'

let browserClient:
  | ReturnType<typeof createClient>
  | null = null

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // 回调页可自动从URL解析
        },
      }
    )
  }
  return browserClient
}