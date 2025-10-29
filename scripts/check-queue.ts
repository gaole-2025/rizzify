import PgBoss from 'pg-boss';

/**
 * 检查 pg-boss 队列中的任务
 */
async function checkQueue() {
  const boss = new PgBoss({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await boss.start();
    console.log('\n' + '='.repeat(80));
    console.log('📊 PG-BOSS 队列状态检查');
    console.log('='.repeat(80) + '\n');

    // 获取队列统计信息
    const stats = await boss.getQueueSize('task_generate');
    console.log('📈 task_generate 队列统计：');
    console.log(`   - 待处理任务: ${stats}`);

    // 获取所有队列名称
    const queues = await boss.getQueues();
    console.log('\n📋 所有队列：');
    queues.forEach((queue) => {
      console.log(`   - ${queue}`);
    });

    // 获取详细的任务信息
    console.log('\n📝 待处理任务详情：');
    const jobs = await boss.getJobsByState('task_generate', 'created', { limit: 100 });
    
    if (jobs.length === 0) {
      console.log('   ✅ 没有待处理任务');
    } else {
      console.log(`   📌 共 ${jobs.length} 个待处理任务：\n`);
      jobs.forEach((job, index) => {
        console.log(`   ${index + 1}. Job ID: ${job.id}`);
        console.log(`      - 状态: ${job.state}`);
        console.log(`      - 创建时间: ${new Date(job.createdOn).toLocaleString('zh-CN')}`);
        console.log(`      - 任务数据:`);
        if (job.data) {
          console.log(`        • taskId: ${job.data.taskId}`);
          console.log(`        • userId: ${job.data.userId}`);
          console.log(`        • plan: ${job.data.plan}`);
          console.log(`        • gender: ${job.data.gender}`);
          console.log(`        • uploadId: ${job.data.uploadId}`);
        }
        console.log();
      });
    }

    // 获取运行中的任务
    console.log('\n🔄 运行中的任务：');
    const activeJobs = await boss.getJobsByState('task_generate', 'active', { limit: 100 });
    
    if (activeJobs.length === 0) {
      console.log('   ✅ 没有运行中的任务');
    } else {
      console.log(`   📌 共 ${activeJobs.length} 个运行中的任务：\n`);
      activeJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. Job ID: ${job.id}`);
        console.log(`      - 状态: ${job.state}`);
        console.log(`      - 开始时间: ${new Date(job.startedOn).toLocaleString('zh-CN')}`);
        console.log(`      - 任务数据:`);
        if (job.data) {
          console.log(`        • taskId: ${job.data.taskId}`);
          console.log(`        • plan: ${job.data.plan}`);
        }
        console.log();
      });
    }

    // 获取失败的任务
    console.log('\n❌ 失败的任务：');
    const failedJobs = await boss.getJobsByState('task_generate', 'failed', { limit: 100 });
    
    if (failedJobs.length === 0) {
      console.log('   ✅ 没有失败的任务');
    } else {
      console.log(`   📌 共 ${failedJobs.length} 个失败的任务：\n`);
      failedJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. Job ID: ${job.id}`);
        console.log(`      - 状态: ${job.state}`);
        console.log(`      - 失败时间: ${new Date(job.completedOn).toLocaleString('zh-CN')}`);
        console.log(`      - 错误: ${job.output?.error || 'N/A'}`);
        console.log();
      });
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ 检查队列失败:', error);
  } finally {
    await boss.stop();
  }
}

checkQueue();
