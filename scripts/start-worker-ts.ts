/**
 * Mock Worker 启动脚本 (TypeScript版本)
 * 使用ts-node直接运行TypeScript代码
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import PgBoss from 'pg-boss';
import { MockWorker } from '../src/worker/mock-worker.js';

// 加载环境变量
dotenv.config({ path: '.env' });

async function startWorker() {
  try {
    console.log('🔧 Starting Mock Worker (TypeScript)...');

    // 检查数据库连接
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    console.log('✅ Environment variables loaded');

    // 解析连接字符串用于pg-boss
    const url = new URL(databaseUrl);
    const dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1),
      user: url.username,
      password: url.password,
      ssl: {
        rejectUnauthorized: false
      }
    };

    console.log('📡 Database configuration:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database
    });

    // 检查R2配置
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const r2AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2SecretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!r2Endpoint || !r2AccessKey || !r2SecretKey) {
      console.warn('⚠️  R2 configuration not found - MockWorker will run but file operations may fail');
    } else {
      console.log('✅ R2 configuration found');
    }

    // 创建并启动Worker
    const worker = new MockWorker();

    // 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down worker...');
      try {
        await worker.stop();
        console.log('✅ Worker stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error stopping worker:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down worker...');
      try {
        await worker.stop();
        console.log('✅ Worker stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error stopping worker:', error);
        process.exit(1);
      }
    });

    // 启动Worker
    await worker.start();
    console.log('✅ Mock Worker started successfully!');
    console.log('⏳ Worker is running and waiting for tasks...');
    console.log('💡 Worker will process image generation tasks from the queue');
    console.log('🔧 Press Ctrl+C to stop the worker');

    // 保持进程运行
    process.stdin.resume();

  } catch (error: any) {
    console.error('❌ Failed to start Mock Worker:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// 启动Worker
startWorker();