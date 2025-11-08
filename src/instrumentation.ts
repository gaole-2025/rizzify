/**
 * Next.js 应用启动时的 instrumentation 钩子
 * 用于启动后台 worker
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  console.log('🚀 [Instrumentation] Initializing Node.js runtime...')

  const enabled = (process.env.MOCK_WORKER_ENABLED ?? 'false') === 'true'
  if (!enabled) {
    console.log('⚠️ [Instrumentation] MockWorker disabled (set MOCK_WORKER_ENABLED=true to enable)')
    return
  }

  try {
    // 使用 eval 避免在构建期被静态打包
    const mod = await (0, eval)("import('./worker/mock-worker')") as any
    console.log('🚀 [Instrumentation] Starting MockWorker...')
    await mod.startWorker()
    console.log('✅ [Instrumentation] MockWorker started successfully')
  } catch (error) {
    console.error('❌ [Instrumentation] Failed to start MockWorker:', error)
    // 不要抛出错误，让应用继续运行
  }
}
