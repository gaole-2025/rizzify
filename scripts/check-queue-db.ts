import { PrismaClient } from '@prisma/client';

/**
 * 直接查询数据库中的队列任务
 */
async function checkQueueFromDB() {
  const prisma = new PrismaClient();

  try {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PG-BOSS 队列状态检查（从数据库）');
    console.log('='.repeat(80) + '\n');

    // 查询 pgboss.job 表中的任务
    const jobs = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        state,
        data,
        created_on as "createdOn",
        started_on as "startedOn",
        completed_on as "completedOn",
        retry_count as "retryCount",
        output
      FROM pgboss.job
      WHERE name = 'task_generate'
      ORDER BY created_on DESC
      LIMIT 100
    `;

    console.log('📋 所有 task_generate 任务：\n');

    if (Array.isArray(jobs) && jobs.length === 0) {
      console.log('   ✅ 没有任务\n');
    } else if (Array.isArray(jobs)) {
      // 按状态分类
      const byState: Record<string, any[]> = {};
      jobs.forEach((job: any) => {
        if (!byState[job.state]) {
          byState[job.state] = [];
        }
        byState[job.state].push(job);
      });

      // 显示各状态的任务数
      console.log('📊 任务统计：');
      Object.entries(byState).forEach(([state, tasks]) => {
        const stateEmoji = {
          created: '⏳',
          active: '🔄',
          completed: '✅',
          failed: '❌',
          cancelled: '🚫',
        }[state] || '❓';
        console.log(`   ${stateEmoji} ${state.toUpperCase()}: ${tasks.length} 个`);
      });

      console.log('\n' + '-'.repeat(80) + '\n');

      // 显示待处理任务（created 状态）
      if (byState.created && byState.created.length > 0) {
        console.log(`⏳ 待处理任务 (${byState.created.length} 个)：\n`);
        byState.created.forEach((job: any, index: number) => {
          console.log(`   ${index + 1}. Job ID: ${job.id}`);
          console.log(`      - 创建时间: ${new Date(job.createdOn).toLocaleString('zh-CN')}`);
          if (job.data) {
            try {
              const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
              console.log(`      - 任务数据:`);
              console.log(`        • taskId: ${data.taskId}`);
              console.log(`        • userId: ${data.userId}`);
              console.log(`        • plan: ${data.plan}`);
              console.log(`        • gender: ${data.gender}`);
            } catch (e) {
              console.log(`      - 数据: ${JSON.stringify(job.data)}`);
            }
          }
          console.log();
        });
      }

      // 显示运行中的任务（active 状态）
      if (byState.active && byState.active.length > 0) {
        console.log(`🔄 运行中的任务 (${byState.active.length} 个)：\n`);
        byState.active.forEach((job: any, index: number) => {
          console.log(`   ${index + 1}. Job ID: ${job.id}`);
          console.log(`      - 开始时间: ${new Date(job.startedOn).toLocaleString('zh-CN')}`);
          if (job.data) {
            try {
              const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
              console.log(`      - 任务: ${data.taskId} (${data.plan})`);
            } catch (e) {
              console.log(`      - 数据: ${JSON.stringify(job.data)}`);
            }
          }
          console.log();
        });
      }

      // 显示失败的任务（failed 状态）
      if (byState.failed && byState.failed.length > 0) {
        console.log(`❌ 失败的任务 (${byState.failed.length} 个)：\n`);
        byState.failed.forEach((job: any, index: number) => {
          console.log(`   ${index + 1}. Job ID: ${job.id}`);
          console.log(`      - 失败时间: ${new Date(job.completedOn).toLocaleString('zh-CN')}`);
          console.log(`      - 重试次数: ${job.retryCount}`);
          if (job.output) {
            console.log(`      - 错误: ${job.output}`);
          }
          console.log();
        });
      }
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQueueFromDB();
