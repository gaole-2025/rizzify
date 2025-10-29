/**
 * pg-boss Worker - 处理图片生成任务
 */

import PgBoss from 'pg-boss'
import { updateTaskStatus } from '../lib/queue'
import { PrismaClient } from '@prisma/client'

// Worker配置
const WORKER_CONFIG = {
  name: 'task_generate',
  teamSize: 1,
  newJobCheckIntervalSeconds: 5
}

// 初始化Prisma客户端
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// 套餐配置
const PLAN_CONFIG = {
  free: { generatedCount: 2, sections: ['free'] },
  start: { generatedCount: 30, sections: ['start'] },
  pro: { generatedCount: 70, sections: ['pro'] }
} as const

// 模拟图片生成处理函数
async function processImageGeneration(job: any) {
  console.log('🔍 [Worker] Received job object:', JSON.stringify(job, null, 2))

  // pg-boss返回job数组，数据在第一个元素的data字段中
  const jobData = Array.isArray(job) ? job[0]?.data : job.data || job.payload || job
  console.log('🔍 [Worker] Job data:', JSON.stringify(jobData, null, 2))

  const { taskId, userId, plan, gender, style, fileKey } = jobData

  console.log(`🎨 [Worker] Starting image generation for task: ${taskId}`)
  console.log(`📋 [Worker] Config: ${plan}, ${gender}, ${style}`)
  console.log(`📁 [Worker] File: ${fileKey}`)

  const startTime = Date.now()

  try {
    // 更新任务状态为运行中
    await updateTaskStatus(taskId, 'running', { progress: 10, etaSeconds: 30 })

    // 获取套餐配置
    const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`)
    }

    console.log(`📊 [Worker] Plan ${plan} requires ${planConfig.generatedCount} generated images`)

    // 模拟图片生成过程
    const stages = [
      { progress: 20, message: 'Analyzing input image...' },
      { progress: 40, message: 'Generating style transfer...' },
      { progress: 60, message: 'Applying AI enhancements...' },
      { progress: 80, message: 'Finalizing result...' },
      { progress: 95, message: 'Saving output image...' }
    ]

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒每阶段
      await updateTaskStatus(taskId, 'running', { progress: stage.progress, etaSeconds: 10 })
      console.log(`🔄 [Worker] ${stage.message} (${stage.progress}%)`)
    }

    // 获取任务信息，包括上传的文件
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { upload: true }
    })

    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    console.log(`📸 [Worker] Found upload: ${task.upload ? task.upload.filename : 'none'}`)

    // 创建上传图片的Photo记录（原始图片）
    if (task.upload) {
      const uploadedPhoto = await prisma.photo.create({
        data: {
          taskId: taskId,
          objectKey: task.upload.objectKey, // 使用上传文件的objectKey
          section: 'uploaded',
          originalName: task.upload.filename,
          width: task.upload.width,
          height: task.upload.height,
          mime: task.upload.contentType,
          sizeBytes: task.upload.sizeBytes,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        }
      })
      console.log(`✅ [Worker] Created uploaded photo record: ${uploadedPhoto.id}`)
    }

    // 创建生成图片的Photo记录（AI生成的图片）
    for (let i = 0; i < planConfig.generatedCount; i++) {
      const generatedPhoto = await prisma.photo.create({
        data: {
          taskId: taskId,
          objectKey: `generated/${taskId}_${i + 1}.jpg`, // 为每个生成的图片创建唯一objectKey
          section: planConfig.sections[0] as any, // 'free', 'start', 或 'pro'
          originalName: `generated_${taskId}_${i + 1}.jpg`,
          width: 512, // 假设的生成图片尺寸
          height: 512,
          mime: 'image/jpeg',
          sizeBytes: BigInt(102400), // 假设的文件大小 100KB
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        }
      })
      console.log(`✅ [Worker] Created generated photo record ${i + 1}/${planConfig.generatedCount}: ${generatedPhoto.id}`)
    }

    // 完成任务
    await updateTaskStatus(taskId, 'done', { progress: 100, etaSeconds: 0 })

    const uploadedCount = task.upload ? 1 : 0
    const totalPhotos = uploadedCount + planConfig.generatedCount

    console.log(`✅ [Worker] Image generation completed for task: ${taskId}`)
    console.log(`🔗 [Worker] Result URL: https://rizzify.org/generated/${taskId}.jpg`)
    console.log(`📊 [Worker] Created ${uploadedCount} uploaded + ${planConfig.generatedCount} generated photos`)

    return {
      success: true,
      resultUrl: `https://rizzify.org/generated/${taskId}.jpg`,
      taskId,
      processingTime: Date.now() - startTime,
      uploadedCount,
      generatedCount: planConfig.generatedCount,
      totalPhotos
    }

  } catch (error) {
    console.error(`❌ [Worker] Failed to process task ${taskId}:`, error)

    // 更新任务状态为错误
    await updateTaskStatus(taskId, 'error', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })

    throw error
  }
}

// 启动worker
export async function startTaskGenerationWorker() {
  const boss = new PgBoss({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    application_name: 'rizzify-worker',
  })

  try {
    console.log('🚀 [Worker] Starting task generation worker...')

    await boss.start()

    // 注册worker处理task_generate队列
    boss.work(WORKER_CONFIG.name, processImageGeneration)

    console.log('✅ [Worker] Task generation worker started successfully')
    console.log(`👥 [Worker] Team size: ${WORKER_CONFIG.teamSize}`)
    console.log(`⏱️  [Worker] Check interval: ${WORKER_CONFIG.newJobCheckIntervalSeconds}s`)

    return boss

  } catch (error) {
    console.error('❌ [Worker] Failed to start worker:', error)
    throw error
  }
}

// 如果直接运行此文件，启动worker
if (require.main === module) {
  startTaskGenerationWorker().catch(error => {
    console.error('❌ [Worker] Fatal error:', error)
    process.exit(1)
  })
}