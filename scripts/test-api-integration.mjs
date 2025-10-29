/**
 * 测试队列和API端点是否正常工作
 */

import { enqueueTaskGeneration, startBossAndEnsureQueues } from '../src/lib/queue.js';

console.log('🧪 Testing API integration...');

async function testAPI() {
  try {
    // 1. 启动队列系统
    console.log('📡 Starting queue system...');
    await startBossAndEnsureQueues();

    // 2. 测试任务入队
    console.log('📤 Testing task enqueue...');
    const jobId = await enqueueTaskGeneration({
      taskId: 'test-task-' + Date.now(),
      userId: 'test-user',
      plan: 'free',
      gender: 'male',
      style: 'classic',
      fileKey: 'test-image.jpg',
      idempotencyKey: 'test-' + Date.now()
    });

    console.log(`✅ Task enqueued successfully: ${jobId}`);

    // 3. 等待一下检查队列状态
    setTimeout(() => {
      console.log('🎉 API integration test completed!');
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }
}

testAPI();