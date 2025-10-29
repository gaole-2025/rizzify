/**
 * Mock Worker 启动脚本
 * 独立启动MockWorker进程
 */

require('dotenv').config({ path: '.env' });

// 手动读取.env文件
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const databaseUrl = envContent.split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1];

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

// 动态导入MockWorker (TypeScript)
async function startWorker() {
  try {
    console.log('🔧 Starting Mock Worker...');

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

    // 设置环境变量供TypeScript代码使用
    process.env.DATABASE_URL = databaseUrl;

    // 动态导入并启动Worker
    const { MockWorker } = await import('../dist/worker/mock-worker.js');
    const worker = new MockWorker();

    // 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down worker...');
      await worker.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down worker...');
      await worker.stop();
      process.exit(0);
    });

    // 启动Worker
    await worker.start();
    console.log('✅ Mock Worker started successfully!');

    // 保持进程运行
    console.log('⏳ Worker is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('❌ Failed to start Mock Worker:', error);
    process.exit(1);
  }
}

startWorker();
