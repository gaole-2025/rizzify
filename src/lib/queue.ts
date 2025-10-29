/**
 * pg-boss 队列配置和管理
 */

import PgBoss from 'pg-boss'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ✅ 用直连连接（5432），不要用 pooler(6543)
const QUEUE_DATABASE_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL

// 单例 Boss（非常重要，避免每次请求都 new）
let bossSingleton: PgBoss | null = null

// 队列配置
export const queueConfig = {
  jobs: {
    task_generate: {
      name: 'task_generate',
      retryLimit: 5,           // 最多重试5次
      retryDelay: 5,           // 初始重试延迟5秒
      retryBackoff: true,      // 指数退避
      startAfterSeconds: 0,    // 立即开始
      teamSize: 1,             // MVP单并发
      newJobCheckIntervalSeconds: 5
    }
  }
}

// 任务类型定义
export interface TaskGenerationJob {
  taskId: string
  userId: string
  uploadId: string
  plan: 'free' | 'start' | 'pro'
  gender: 'male' | 'female'
  style: string
  fileKey: string
  idempotencyKey: string
}

export function getBoss(): PgBoss {
  if (bossSingleton) return bossSingleton
  bossSingleton = new PgBoss({
    connectionString: QUEUE_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    application_name: 'rizzify-boss',
  })

  bossSingleton.on('error', (err) => console.error('[pg-boss] error', err))
  bossSingleton.on('ready', () => console.log('✅ [pg-boss] ready'))

  return bossSingleton
}

// ✅ 兼容性：保留 createQueue 函数（但现在返回单例）
export function createQueue(): PgBoss {
  return getBoss()
}

// 启动 + 创建必要队列（进程只调用一次）
export async function startBossAndEnsureQueues() {
  const boss = getBoss()
  await boss.start()
  // ✅ v11 需要先创建队列
  await boss.createQueue(queueConfig.jobs.task_generate.name)
  console.log('✅ [pg-boss] queues ensured')
  return boss
}

// 创建数据库表（如果不存在）
export async function createQueueTables(boss: PgBoss): Promise<void> {
  try {
    // pg-boss会自动创建表，这里我们只需要确保启动
    await boss.start()
    console.log('✅ Queue tables created/verified automatically')
  } catch (error) {
    console.error('❌ Failed to create queue tables:', error)
    throw error
  }
}

// 投递任务到队列
export async function enqueueTaskGeneration(
  jobData: TaskGenerationJob,
  options: {
    startAfter?: number
    priority?: number
  } = {}
): Promise<string> {
  try {
    const boss = getBoss()
    const jobId = await boss.send(
      queueConfig.jobs.task_generate.name,
      jobData,
      {
        startAfter: options.startAfter || 0,
        priority: options.priority || 0
      }
    )

    console.log(`✅ Task generation job enqueued: ${jobId}`)
    return jobId
  } catch (error) {
    console.error('❌ Failed to enqueue job:', error)
    throw error
  }
}

// 更新任务状态的工具函数
export async function updateTaskStatus(
  taskId: string,
  status: 'queued' | 'running' | 'done' | 'error',
  options: {
    progress?: number
    etaSeconds?: number
    errorCode?: string
    errorMessage?: string
  } = {}
): Promise<void> {
  try {
    const updateData: any = {
      status
    }

    if (options.progress !== undefined) {
      updateData.progress = options.progress
    }

    if (options.etaSeconds !== undefined) {
      updateData.etaSeconds = options.etaSeconds
    }

    if (options.errorCode) {
      updateData.errorCode = options.errorCode
    }

    if (options.errorMessage) {
      updateData.errorMessage = options.errorMessage
    }

    if (status === 'running' && !updateData.startedAt) {
      updateData.startedAt = new Date()
    }

    if (status === 'done') {
      updateData.completedAt = new Date()
      updateData.progress = 100
      updateData.etaSeconds = 0
    }

    await prisma.task.update({
      where: { id: taskId },
      data: updateData
    })

    console.log(`✅ Task ${taskId} status updated to ${status}`)
  } catch (error) {
    console.error(`❌ Failed to update task ${taskId} status:`, error)
    throw error
  }
}