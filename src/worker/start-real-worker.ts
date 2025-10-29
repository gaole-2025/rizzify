/**
 * Real Worker Starter
 * 启动 RealWorker 处理 Apicore API 生成任务
 */

import { startRealWorker } from './real-worker';

async function main() {
  try {
    console.log('🚀 Starting Rizzify RealWorker...');
    const boss = await startRealWorker();

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📛 Received ${signal}, shutting down gracefully...`);
      try {
        if (boss) {
          await boss.stop();
        }
        console.log('✅ RealWorker stopped');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    console.log('✅ RealWorker is running and ready to process tasks');
  } catch (error) {
    console.error('❌ Failed to start RealWorker:', error);
    process.exit(1);
  }
}

main();
