/**
 * 真正的 Mock Worker 启动脚本
 * 启动实际处理任务的 worker
 */

require('dotenv').config({ path: '.env' });

// 动态导入 MockWorker
async function startRealWorker() {
  try {
    console.log('🚀 Starting Real Mock Worker...');

    // 检查环境配置
    const fs = require('fs');
    const path = require('path');
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const databaseUrl = envContent.split('\n')
      .find(line => line.startsWith('DIRECT_URL='))
      ?.split('=')[1];

    if (!databaseUrl) {
      console.error('❌ DIRECT_URL not found in .env file');
      process.exit(1);
    }

    console.log('✅ Environment configuration found');

    // 由于 TypeScript 文件需要编译，我们创建一个简化版本
    // 直接使用 pg-boss 来处理 task_generate 队列

    const PgBoss = require('pg-boss');

    // 使用和API完全相同的配置
    const config = {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      application_name: 'rizzify-worker',
    };

    const boss = new PgBoss(config);

    boss.on('error', (error) => {
      console.error('Queue error:', error);
    });

    boss.on('ready', () => {
      console.log('✅ Queue system ready');
    });

    await boss.start();
    console.log('✅ pg-boss started successfully');

    // 创建 task_generate 队列
    await boss.createQueue('task_generate');
    console.log('✅ task_generate queue created');

    // 模拟进度时间线 - 快速版本
    const progressTimeline = [
      { progress: 20, eta: 15 },
      { progress: 40, eta: 12 },
      { progress: 60, eta: 9 },
      { progress: 80, eta: 6 },
      { progress: 100, eta: 0 }
    ];

    // 注册任务处理器
    boss.work('task_generate', async (jobs) => {
      // pg-boss 11.0.7 数据结构 - 接收job数组，数据在job[0].data中
      console.log('📋 Jobs received:', jobs.length);

      if (!Array.isArray(jobs) || jobs.length === 0) {
        console.error('❌ No jobs received');
        return;
      }

      const job = jobs[0];
      console.log('📋 Processing job:', job.id);

      // 数据在job.data中
      const jobData = job.data;
      if (!jobData || !jobData.taskId) {
        console.error('❌ No valid job data found in job:', job);
        return;
      }

      console.log('📋 Job data:', JSON.stringify(jobData, null, 2));
      const { taskId, userId, plan, gender, style } = jobData;

      if (!taskId) {
        console.error('❌ Missing taskId in job data:', jobData);
        return;
      }
      console.log(`📸 Processing task generation: ${taskId} (${plan}, ${gender}, ${style})`);

      try {
        // 模拟任务处理
        for (let i = 0; i < progressTimeline.length; i++) {
          const { progress, eta } = progressTimeline[i];

          // 模拟处理时间 - 快速版本
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒间隔

          // 更新任务状态到数据库
          try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            await prisma.task.update({
              where: { id: taskId },
              data: {
                status: progress === 100 ? 'done' : 'running',
                progress: progress,
                etaSeconds: eta
              }
            });

            console.log(`📊 Task ${taskId} progress: ${progress}% (ETA: ${eta}s)`);

            // 如果是最后一步，创建一些模拟的照片记录
            if (progress === 100) {
              const quantities = { free: 1, start: 5, pro: 10 };
              const quantity = quantities[plan] || 1;
              const section = plan === 'free' ? 'free' : plan;

              for (let i = 0; i < quantity; i++) {
                await prisma.photo.create({
                  data: {
                    taskId,
                    section: section,
                    objectKey: `results/${taskId}/${section}/${String(i + 1).padStart(3, '0')}.jpg`,
                    originalName: `${String(i + 1).padStart(3, '0')}.jpg`,
                    width: 1024,
                    height: 1024,
                    mime: 'image/jpeg',
                    sizeBytes: BigInt(200000),
                    expiresAt: plan === 'free' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
                    createdAt: new Date()
                  }
                });
              }

              console.log(`📷 Created ${quantity} photos for task ${taskId}`);
            }

            await prisma.$disconnect();
          } catch (dbError) {
            console.error('❌ Failed to update task status:', dbError);
          }
        }

        console.log(`✅ Task ${taskId} completed successfully`);

      } catch (error) {
        console.error(`❌ Task ${taskId} failed:`, error);

        // 更新任务状态为错误
        try {
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();

          await prisma.task.update({
            where: { id: taskId },
            data: {
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          });

          await prisma.$disconnect();
        } catch (dbError) {
          console.error('❌ Failed to update error status:', dbError);
        }

        throw error;
      }
    });

    console.log('✅ Task handler registered for task_generate');
    console.log('🎉 Real MockWorker is now running and processing tasks!');
    console.log('📋 Tasks will be processed automatically when they are queued.');
    console.log('⏳ Worker is listening for tasks... Press Ctrl+C to exit.');

    // 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down worker...');
      try {
        await boss.stop();
        console.log('✅ Worker stopped gracefully');
      } catch (error) {
        console.error('❌ Error stopping worker:', error);
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down worker...');
      try {
        await boss.stop();
        console.log('✅ Worker stopped gracefully');
      } catch (error) {
        console.error('❌ Error stopping worker:', error);
      }
      process.exit(0);
    });

    // 保持进程运行
    process.stdin.resume();

  } catch (error) {
    console.error('❌ Failed to start Real Mock Worker:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

startRealWorker();