/**
 * Next.js 应用启动时的 instrumentation 钩子
 * 用于启动后台 worker
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 [Instrumentation] Initializing Node.js runtime...');
    
    try {
      // 动态导入 MockWorker（避免在浏览器环境中导入）
      const { startWorker } = await import('./worker/mock-worker');
      
      console.log('🚀 [Instrumentation] Starting MockWorker...');
      await startWorker();
      console.log('✅ [Instrumentation] MockWorker started successfully');
    } catch (error) {
      console.error('❌ [Instrumentation] Failed to start MockWorker:', error);
      // 不要抛出错误，让应用继续运行
    }
  }
}
