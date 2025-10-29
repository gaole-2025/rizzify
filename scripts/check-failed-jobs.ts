import { PrismaClient } from '@prisma/client';

async function checkFailedJobs() {
  const prisma = new PrismaClient();

  try {
    console.log('\n' + '='.repeat(80));
    console.log('❌ 失败任务详细信息');
    console.log('='.repeat(80) + '\n');

    const failedJobs = await prisma.$queryRaw`
      SELECT 
        id,
        data,
        output,
        completed_on as "completedOn",
        retry_count as "retryCount"
      FROM pgboss.job
      WHERE name = 'task_generate' AND state = 'failed'
      ORDER BY completed_on DESC
      LIMIT 10
    `;

    if (Array.isArray(failedJobs) && failedJobs.length > 0) {
      failedJobs.forEach((job: any, index: number) => {
        console.log(`${index + 1}. Job ID: ${job.id}`);
        console.log(`   失败时间: ${new Date(job.completedOn).toLocaleString('zh-CN')}`);
        console.log(`   重试次数: ${job.retryCount}`);
        
        if (job.data) {
          try {
            const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
            console.log(`   任务: ${data.taskId} (${data.plan})`);
          } catch (e) {
            console.log(`   数据: ${job.data}`);
          }
        }

        if (job.output) {
          console.log(`   错误信息:`);
          try {
            const output = typeof job.output === 'string' ? JSON.parse(job.output) : job.output;
            console.log(`   ${JSON.stringify(output, null, 4)}`);
          } catch (e) {
            console.log(`   ${job.output}`);
          }
        }
        console.log();
      });
    } else {
      console.log('✅ 没有失败的任务\n');
    }

    // 查询完成的任务
    console.log('\n' + '='.repeat(80));
    console.log('✅ 已完成的任务');
    console.log('='.repeat(80) + '\n');

    const completedJobs = await prisma.$queryRaw`
      SELECT 
        id,
        data,
        completed_on as "completedOn"
      FROM pgboss.job
      WHERE name = 'task_generate' AND state = 'completed'
      ORDER BY completed_on DESC
      LIMIT 10
    `;

    if (Array.isArray(completedJobs) && completedJobs.length > 0) {
      completedJobs.forEach((job: any, index: number) => {
        console.log(`${index + 1}. Job ID: ${job.id}`);
        console.log(`   完成时间: ${new Date(job.completedOn).toLocaleString('zh-CN')}`);
        
        if (job.data) {
          try {
            const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
            console.log(`   任务: ${data.taskId} (${data.plan})`);
          } catch (e) {
            console.log(`   数据: ${job.data}`);
          }
        }
        console.log();
      });
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFailedJobs();
