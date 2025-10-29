/**
 * Mock Worker - 模拟图片生成工作器
 * 在真实AI推理接入之前，使用模板图片模拟生成过程
 */

import { PgBoss } from 'pg-boss'
import { PrismaClient } from '@prisma/client'
import {
  TaskGenerationJob,
  updateTaskStatus,
  getBoss,
  startBossAndEnsureQueues
} from '@/lib/queue'
import {
  TEMPLATE_INDEX,
  PLAN_QUANTITIES,
  GENERATION_CONFIG,
  selectRandomTemplates,
  getResultPath,
  getTemplatePath,
  GenderKey,
  StyleKey
} from './templates'
import {
  copyFile,
  deleteFile,
  R2_BUCKETS
} from '@/lib/storage'

const prisma = new PrismaClient()

/**
 * Mock Worker 主类
 */
export class MockWorker {
  private boss: PgBoss | null = null
  private isRunning = false

  constructor() {
    // 不在构造函数中初始化，延迟到start()
  }

  /**
   * 启动Worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  MockWorker already running')
      return
    }

    try {
      console.log('🚀 Starting MockWorker...')

      // 获取boss实例并启动
      this.boss = getBoss()
      await startBossAndEnsureQueues()

      // 注册工作处理器
      await this.registerJobHandlers()

      this.isRunning = true
      console.log('✅ MockWorker started successfully')

    } catch (error) {
      console.error('❌ Failed to start MockWorker:', error)
      throw error
    }
  }

  /**
   * 停止Worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    try {
      console.log('🛑 Stopping MockWorker...')
      if (this.boss) {
        await this.boss.stop()
      }
      this.isRunning = false
      console.log('✅ MockWorker stopped')
    } catch (error) {
      console.error('❌ Failed to stop MockWorker:', error)
    }
  }

  /**
   * 注册任务处理器
   */
  private async registerJobHandlers(): Promise<void> {
    if (!this.boss) {
      throw new Error('Boss not initialized')
    }

    // 注册图片生成任务处理器
    this.boss.work('task_generate', async (job) => {
      await this.handleTaskGeneration(job.data as TaskGenerationJob)
    }, {
      teamSize: 1,
      retryLimit: 5,
      retryDelay: 5,
      retryBackoff: true
    })

    console.log('✅ Job handlers registered')
  }

  /**
   * 处理图片生成任务
   */
  private async handleTaskGeneration(jobData: TaskGenerationJob): Promise<void> {
    const { taskId, userId, plan, gender, style, fileKey, idempotencyKey } = jobData

    console.log(`📸 Processing task generation: ${taskId} (${plan}, ${gender}, ${style})`)

    try {
      // 1. 更新任务状态为运行中
      await updateTaskStatus(taskId, 'running', {
        progress: 10,
        etaSeconds: 900 // 15分钟
      })

      // 2. 模拟处理进度
      await this.simulateProgress(taskId)

      // 3. 生成结果图片（复制模板）
      await this.generateResults(taskId, plan, gender as GenderKey, style as StyleKey)

      // 4. 完成任务
      await updateTaskStatus(taskId, 'done')

      console.log(`✅ Task ${taskId} completed successfully`)

    } catch (error) {
      console.error(`❌ Task ${taskId} failed:`, error)

      await updateTaskStatus(taskId, 'error', {
        errorCode: 'worker_failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error // 让pg-boss执行重试
    }
  }

  /**
   * 模拟处理进度
   */
  private async simulateProgress(taskId: string): Promise<void> {
    const timeline = GENERATION_CONFIG.progressTimeline

    for (let i = 1; i < timeline.length; i++) {
      const { progress, eta } = timeline[i]

      // 模拟处理时间
      await this.sleep(2000) // 2秒间隔，模拟真实处理时间

      await updateTaskStatus(taskId, 'running', {
        progress,
        etaSeconds: eta
      })

      console.log(`📊 Task ${taskId} progress: ${progress}% (ETA: ${eta}s)`)
    }
  }

  /**
   * 生成结果图片（复制模板）
   */
  private async generateResults(
    taskId: string,
    plan: 'free' | 'start' | 'pro',
    gender: GenderKey,
    style: StyleKey
  ): Promise<void> {
    const quantity = PLAN_QUANTITIES[plan]
    const templates = selectRandomTemplates(gender, style, quantity)

    console.log(`🎨 Generating ${quantity} images for ${plan} plan`)

    const section = plan === 'free' ? 'free' : plan
    const expiresAt = plan === 'free'
      ? new Date(Date.now() + GENERATION_CONFIG.expiration.free)
      : new Date(Date.now() + GENERATION_CONFIG.expiration.start)

    // 生成每张图片
    for (let i = 0; i < templates.length; i++) {
      const templateFilename = templates[i]
      const resultFilename = `${String(i + 1).padStart(3, '0')}.jpg`

      const sourcePath = getTemplatePath(gender, style, templateFilename)
      const targetPath = getResultPath(taskId, section, resultFilename)

      // 复制模板文件到结果目录
      await copyFile(R2_BUCKETS.TEMPLATES, sourcePath, R2_BUCKETS.RESULTS, targetPath)

      // 保存到数据库
      await prisma.photo.create({
        data: {
          taskId,
          section: section as any, // Type conversion
          objectKey: targetPath,
          originalName: resultFilename,
          width: 1024, // 模拟尺寸
          height: 1024,
          mime: 'image/jpeg',
          sizeBytes: BigInt(200000), // 模拟200KB
          expiresAt: plan === 'free' ? expiresAt : null,
          createdAt: new Date()
        }
      })

      console.log(`📷 Generated image ${i + 1}/${quantity}: ${resultFilename}`)
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats(): Promise<any> {
    try {
      const stats = await this.boss.getStats()
      return stats
    } catch (error) {
      console.error('❌ Failed to get queue stats:', error)
      return null
    }
  }
}

// 全局Worker实例
let workerInstance: MockWorker | null = null

/**
 * 获取Worker实例
 */
export function getWorker(): MockWorker {
  if (!workerInstance) {
    workerInstance = new MockWorker()
  }
  return workerInstance
}

/**
 * 启动Worker（用于应用启动时）
 */
export async function startWorker(): Promise<void> {
  const worker = getWorker()
  await worker.start()
}

/**
 * 停止Worker（用于应用关闭时）
 */
export async function stopWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.stop()
    workerInstance = null
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down worker...')
  await stopWorker()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down worker...')
  await stopWorker()
  process.exit(0)
})