/**
 * pg-boss Worker - 处理图片生成任务 (CommonJS版本)
 */

const PgBoss = require('pg-boss')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()
const LOCK_KEY = 748392
const PID_PATH = '.rizzify-worker.pid'

// 数据库锁函数
async function tryAcquireDbLock() {
  const res = await prisma.$queryRawUnsafe(`SELECT pg_try_advisory_lock(${LOCK_KEY}) as locked;`)
  return !!res?.[0]?.locked
}

async function releaseDbLock() {
  await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(${LOCK_KEY});`)
}

// PID文件锁函数
function tryCreatePidFile() {
  try {
    if (fs.existsSync(PID_PATH)) {
      const oldPid = Number(fs.readFileSync(PID_PATH, 'utf8'))
      try { process.kill(oldPid, 0); return false } catch { /* 不存在 */ }
    }
    fs.writeFileSync(PID_PATH, String(process.pid))
    process.on('exit', () => { try { fs.unlinkSync(PID_PATH) } catch {} })
    return true
  } catch { return false }
}

// 任务抢占函数
async function tryClaimTask(taskId) {
  const res = await prisma.task.updateMany({
    where: { id: taskId, status: 'queued' },
    data: { status: 'running', startedAt: new Date(), progress: 10, etaSeconds: 900 },
  })
  return res.count === 1
}

// 更新任务状态的工具函数
async function updateTaskStatus(taskId, status, options = {}) {
  try {
    const updateData = {
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

// 模拟图片生成处理函数
async function processImageGeneration(job) {
  console.log('🔍 [Worker] Debug: Job object:', JSON.stringify(job, null, 2))

  // pg-boss传递的是数组格式，取第一个元素
  const actualJob = Array.isArray(job) ? job[0] : job
  console.log('🔍 [Worker] Debug: Actual job:', JSON.stringify(actualJob, null, 2))

  // 获取任务数据
  const taskData = actualJob.data || actualJob.payload || actualJob
  console.log('🔍 [Worker] Debug: Task data:', JSON.stringify(taskData, null, 2))

  const { taskId, userId, plan, gender, style, fileKey } = taskData

  console.log(`🎨 [Worker] Starting image generation for task: ${taskId}`)
  console.log(`📋 [Worker] Config: ${plan}, ${gender}, ${style}`)
  console.log(`📁 [Worker] File: ${fileKey}`)

  try {
    // 尝试抢占任务
    const claimed = await tryClaimTask(taskId)
    if (!claimed) {
      console.warn(`⚠️  [Worker] Skip task ${taskId}: already claimed by another worker`)
      return { success: false, reason: 'task_already_claimed', taskId }
    }
    console.log(`🎯 [Worker] Successfully claimed task: ${taskId}`)

    // 任务已经被tryClaimTask更新为running，这里不再重复更新状态

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

    // 根据plan确定要生成的sections
    const sections = []
    if (plan === 'free') {
      sections.push('free')
    } else if (plan === 'start') {
      sections.push('free', 'start')
    } else if (plan === 'pro') {
      sections.push('free', 'start', 'pro')
    }

    // 为每个section创建Photo记录（模拟生成的图片）
    const createdPhotos = []
    for (const section of sections) {
      const photo = await prisma.photo.create({
        data: {
          taskId,
          section,
          objectKey: `generated/${taskId}/${section}.jpg`,
          originalName: `${section}_${taskId}.jpg`,
          width: 512,
          height: 512,
          mime: 'image/jpeg',
          sizeBytes: BigInt(204800), // 200KB
          // 设置过期时间：7天后
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
      createdPhotos.push(photo)
      console.log(`📸 [Worker] Created photo for section ${section}: ${photo.id}`)
    }

    // 模拟生成结果URL
    const resultUrl = `https://rizzify-results.r2.dev/generated/${taskId}/`

    // 完成任务
    await updateTaskStatus(taskId, 'done', { progress: 100, etaSeconds: 0 })

    console.log(`✅ [Worker] Image generation completed for task: ${taskId}`)
    console.log(`🔗 [Worker] Result: ${resultUrl}`)
    console.log(`📊 [Worker] Created ${createdPhotos.length} photo records`)

    return {
      success: true,
      resultUrl,
      taskId,
      photosCreated: createdPhotos.length,
      sections,
      processingTime: Date.now() - Date.now() // 临时处理，实际应该从数据库startedAt计算
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
async function startTaskGenerationWorker() {
  // 1. 检查PID文件锁
  const pidLocked = tryCreatePidFile()
  if (!pidLocked) {
    console.error('⚠️  [Worker] PID lock found. Another worker is already running.')
    process.exit(0)
  }
  console.log('🔒 [Worker] PID lock created successfully')

  // 2. 获取数据库锁
  const dbLocked = await tryAcquireDbLock()
  if (!dbLocked) {
    console.error('⚠️  [Worker] Database advisory lock failed. Another worker is running.')
    process.exit(0)
  }
  console.log('🔐 [Worker] Database advisory lock acquired successfully')

  // 3. 设置清理处理
  process.on('SIGINT', async () => {
    console.log('\n🛑 [Worker] Received SIGINT, cleaning up...')
    await releaseDbLock();
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    console.log('\n🛑 [Worker] Received SIGTERM, cleaning up...')
    await releaseDbLock();
    process.exit(0)
  })
  process.on('exit', async () => {
    await releaseDbLock()
  })

  const boss = new PgBoss({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    application_name: 'rizzify-worker',
  })

  try {
    console.log('🚀 [Worker] Starting task generation worker...')

    await boss.start()

    // 注册worker处理task_generate队列
    boss.work('task_generate', processImageGeneration)

    console.log('✅ [Worker] Task generation worker started successfully')
    console.log(`👥 [Worker] Team size: 1`)
    console.log(`⏱️  [Worker] Check interval: 5s`)

    return boss

  } catch (error) {
    console.error('❌ [Worker] Failed to start worker:', error)
    await releaseDbLock()
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

module.exports = { startTaskGenerationWorker, processImageGeneration }