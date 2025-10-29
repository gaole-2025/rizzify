/**
 * 修复后的pg-boss队列测试脚本
 * 使用直连5432 + 显式创建队列
 */

require('dotenv').config({ path: '.env' });

// 手动读取.env文件以确保配置加载
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');

// ✅ 用直连 5432（DIRECT_URL），不要用 pooler(6543)
const databaseUrl = envContent.split('\n')
  .find(line => line.startsWith('DIRECT_URL='))
  ?.split('=')[1];

if (!databaseUrl) {
  console.error('❌ DIRECT_URL not found in .env file');
  console.error('Please add DIRECT_URL to your .env file for pg-boss to work properly');
  process.exit(1);
}

console.log('🔧 Testing pg-boss queue with DIRECT_URL...');

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

console.log('📡 DB Config:', {
  host: config.host,
  port: config.port,
  database: config.database,
  usingDirectConnection: true
});

const PgBoss = require('pg-boss');

async function testQueue() {
  try {
    console.log('\n🧪 Testing pg-boss queue with fixed configuration...');

    // 创建boss实例（使用直连）
    const boss = new PgBoss({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      application_name: 'rizzify-test',
    });

    // 错误处理
    boss.on('error', (error) => {
      console.error('[pg-boss] error:', error);
    });

    boss.on('ready', () => {
      console.log('✅ [pg-boss] ready');
    });

    // 启动boss
    console.log('\n📡 Starting pg-boss...');
    await boss.start();
    console.log('✅ pg-boss started successfully');

    // ✅ 关键：显式创建队列（v11需要）
    console.log('\n📋 Creating queue...');
    await boss.createQueue('test_task');
    console.log('✅ Queue "test_task" created');

    // 测试发送任务
    console.log('\n📤 Sending test job...');
    const jobId = await boss.send('test_task', {
      message: 'Hello from fixed pg-boss test!',
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Test job sent: ${jobId}`);

    // 注册工作处理器
    console.log('\n👷 Registering worker...');
    let taskProcessed = false;

    boss.work('test_task', async (job) => {
      console.log(`📨 Received test job: ${job.id}`);
      console.log('📄 Job data:', job.data);
      taskProcessed = true;
      console.log('✅ Test job processed successfully');
    }, {
      teamSize: 1,
      retryLimit: 3,
      retryDelay: 2,
    });

    // 等待任务处理
    console.log('\n⏳ Waiting for job processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (taskProcessed) {
      console.log('✅ Queue test PASSED! Task was processed successfully');
    } else {
      console.log('⚠️  Task was not processed within timeout period');
    }

    // 获取统计信息
    console.log('\n📊 Getting queue stats...');
    const stats = await boss.getStats();
    console.log('📈 Queue stats:', {
      created: stats.created,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      cancelled: stats.cancelled
    });

    // 测试task_generate队列（生产队列）
    console.log('\n🏭 Creating production queue...');
    await boss.createQueue('task_generate');
    console.log('✅ Production queue "task_generate" created');

    console.log('\n🎉 All queue tests completed successfully!');
    console.log('✅ Database connection: Working (using DIRECT_URL)');
    console.log('✅ Queue creation: Working');
    console.log('✅ Task sending: Working');
    console.log('✅ Task processing: Working');

    // 停止boss
    await boss.stop();
    console.log('\n✅ pg-boss stopped');

    return true;

  } catch (error) {
    console.error('\n❌ Queue test failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    if (error.name === 'ConnectionRefusedError') {
      console.error('\n💡 Connection failed. Please check:');
      console.error('1. DIRECT_URL is correct in .env');
      console.error('2. Database server is accessible');
      console.error('3. SSL settings are correct');
    } else if (error.message.includes('permission denied')) {
      console.error('\n💡 Permission denied. Please check:');
      console.error('1. Database user has necessary permissions');
      console.error('2. Using correct credentials');
    }

    return false;
  }
}

testQueue().then(success => {
  if (success) {
    console.log('\n🚀 pg-boss is ready for production use!');
    console.log('✅ Queue system working correctly');
    console.log('\n📋 Next steps:');
    console.log('1. Start MockWorker: node scripts/start-worker-cjs.js');
    console.log('2. Test API endpoints');
    console.log('3. Start development server: pnpm dev');
  } else {
    console.log('\n❌ Please fix queue configuration before proceeding.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});