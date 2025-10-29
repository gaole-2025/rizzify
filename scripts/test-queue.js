/**
 * 测试pg-boss队列系统
 */

const fs = require('fs');
const path = require('path');

// 手动读取.env文件
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const databaseUrl = envContent.split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1];

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env file');
  console.error('Found content:', envContent.substring(0, 200));
  process.exit(1);
}

console.log('📡 Found DATABASE_URL:', databaseUrl.substring(0, 50) + '...');

const PgBoss = require('pg-boss');

async function testQueue() {
  console.log('🔧 Testing pg-boss queue system...');

  // 解析连接字符串
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.substring(1),
    user: url.username,
    password: url.password,
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log('📡 DB Config:', { host: config.host, port: config.port, database: config.database });

  const boss = new PgBoss(config);

  try {
    console.log('📡 Starting pg-boss...');
    await boss.start();
    console.log('✅ pg-boss started successfully');

    // pg-boss会自动创建表，不需要手动调用createTables
    console.log('✅ Queue tables will be created automatically');

    // 测试发送任务（这会创建队列）
    console.log('📤 Sending test job...');
    const jobId = await boss.send('test_job', {
      message: 'Hello from test job!',
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Test job sent: ${jobId}`);

    // 测试工作处理器
    console.log('👷 Registering worker...');
    boss.work('test_job', async (job) => {
      console.log(`📨 Received job: ${job.id}`);
      console.log('📄 Job data:', job.data);
      console.log('✅ Test job processed successfully');
    });

    // 等待处理
    console.log('⏳ Waiting for job processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 获取统计信息
    console.log('📊 Getting queue stats...');
    const stats = await boss.getStats();
    console.log('📈 Queue stats:', JSON.stringify(stats, null, 2));

    console.log('🎉 Queue test completed successfully!');

  } catch (error) {
    console.error('❌ Queue test failed:', error);
    throw error;
  } finally {
    console.log('🛑 Stopping pg-boss...');
    await boss.stop();
    console.log('✅ pg-boss stopped');
  }
}

testQueue().catch(console.error);
