/**
 * Real Worker - 真实 AI 图片生成工作器
 * 集成 Apicore API、提示词采样、美颜处理、图片管理
 */

import PgBoss from 'pg-boss';
import { PrismaClient } from '@prisma/client';
import { updateTaskStatus } from '../lib/queue';
import { promptSampler } from '../lib/prompt-sampler';
import { apicoreClient } from '../lib/apicore-client';
import { imageManager } from '../lib/image-manager';
import { beautifyProcessor } from '../lib/beautify-processor';
import { createPhotosInBatch } from '../lib/batch-photo-creator';
import { watermarkProcessor } from '../lib/watermark-processor';
import { quotasRepo } from '../db/repo/quotas.repo';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const WORKER_CONFIG = {
  name: 'task_generate',
  teamSize: 8,  // 🚀 优化：增加为 8 个并行 worker（提升吞吐量 2 倍）
  newJobCheckIntervalSeconds: 5,
};

interface JobData {
  taskId: string;
  userId: string;
  plan: 'free' | 'start' | 'pro';
  gender: 'male' | 'female' | 'unisex';
  style: string;
  uploadId: string;
}

/**
 * 处理图片生成任务
 */
async function processImageGeneration(job: any): Promise<any> {
  console.log('\n' + '='.repeat(80));
  console.log('[RealWorker] ========== JOB RECEIVED ==========');
  console.log('[RealWorker] Received job:', JSON.stringify(job, null, 2));

  const jobData: JobData = Array.isArray(job) ? job[0]?.data : job.data || job.payload || job;
  const { taskId, userId, plan, gender, style, uploadId } = jobData;

  console.log('[RealWorker] ========== JOB PARSED ==========');
  console.log(`[RealWorker] taskId: ${taskId}`);
  console.log(`[RealWorker] userId: ${userId}`);
  console.log(`[RealWorker] uploadId: ${uploadId}`);
  console.log(`[RealWorker] plan: ${plan}`);
  console.log(`[RealWorker] gender: ${gender}`);
  console.log(`[RealWorker] style: ${style}`);

  const startTime = Date.now();

  try {
    // Step 1: 更新任务状态为运行中
    console.log('\n[RealWorker] ========== STEP 1: UPDATE STATUS TO RUNNING ==========');
    await updateTaskStatus(taskId, 'running', { progress: 5, etaSeconds: 120 });
    console.log('[RealWorker] ✅ Task status updated to running');

    // Step 2: 获取用户上传的图片
    console.log('\n[RealWorker] ========== STEP 2: FETCH UPLOAD ==========');
    console.log(`[RealWorker] Fetching upload with ID: ${uploadId}`);
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    console.log(`[RealWorker] ✅ Found upload: ${upload.filename}`);
    console.log(`[RealWorker]    - objectKey: ${upload.objectKey}`);
    console.log(`[RealWorker]    - size: ${upload.sizeBytes} bytes`);
    console.log(`[RealWorker]    - dimensions: ${upload.width}x${upload.height}`);

    // 构建用户图片的完整 URL
    const userImageUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_USER_DATA_DOMAIN}/${upload.objectKey}`;
    console.log(`[RealWorker]    - URL: ${userImageUrl}`);

    // Step 3: 创建上传图片的 Photo 记录
    console.log('\n[RealWorker] ========== STEP 3: CREATE UPLOADED PHOTO RECORD ==========');
    const uploadedPhoto = await prisma.photo.create({
      data: {
        taskId,
        objectKey: upload.objectKey,
        section: 'uploaded',
        originalName: upload.filename,
        width: upload.width,
        height: upload.height,
        mime: upload.contentType,
        sizeBytes: upload.sizeBytes,
        expiresAt: plan === 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    });

    console.log(`[RealWorker] ✅ Created uploaded photo: ${uploadedPhoto.id}`);

    // Step 4: 执行美颜预处理
    console.log('\n[RealWorker] ========== STEP 4: BEAUTIFY PROCESSING ==========');
    console.log(`[RealWorker] Starting beautify for image: ${userImageUrl}`);
    await updateTaskStatus(taskId, 'running', { progress: 15, etaSeconds: 110 });

    const beautifyResult = await beautifyProcessor.process(userImageUrl, taskId);
    console.log(`[RealWorker] ✅ Beautify completed`);
    console.log(`[RealWorker]    - r2ObjectKey: ${beautifyResult.r2ObjectKey}`);
    console.log(`[RealWorker]    - sizeBytes: ${beautifyResult.sizeBytes}`);
    console.log(`[RealWorker]    - imageUrl: ${beautifyResult.imageUrl}`);

    const beautifiedPhoto = await prisma.photo.create({
      data: {
        taskId,
        objectKey: beautifyResult.r2ObjectKey,
        section: 'beautified',
        originalName: `beautified_${taskId}.jpg`,
        width: 1024,
        height: 1024,
        mime: 'image/jpeg',
        sizeBytes: beautifyResult.sizeBytes,
        expiresAt: plan === 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    });

    console.log(`[RealWorker] ✅ Created beautified photo: ${beautifiedPhoto.id}`);

    // Step 5: 采样提示词
    console.log('\n[RealWorker] ========== STEP 5: SAMPLE PROMPTS ==========');
    console.log(`[RealWorker] Sampling prompts for plan=${plan}, gender=${gender}`);
    await updateTaskStatus(taskId, 'running', { progress: 25, etaSeconds: 100 });

    const sampledPrompts = await promptSampler.sample(gender as any, plan);
    console.log(`[RealWorker] ✅ Sampled ${sampledPrompts.count} prompts`);
    console.log(`[RealWorker]    - First 3 prompts:`);
    sampledPrompts.prompts.slice(0, 3).forEach((p, i) => {
      console.log(`[RealWorker]      ${i + 1}. ${p.text.substring(0, 60)}...`);
    });

    // Step 6: 生成风格照片
    console.log('\n[RealWorker] ========== STEP 6: GENERATE STYLED PHOTOS ==========');
    const totalPrompts = sampledPrompts.count;
    const batchSize = parseInt(process.env.APIORE_BATCH_SIZE || '5', 10);
    const batches = Math.ceil(totalPrompts / batchSize);

    console.log(`[RealWorker] Total images to generate: ${totalPrompts}`);
    console.log(`[RealWorker] Batch size: ${batchSize}`);
    console.log(`[RealWorker] Number of batches: ${batches}`);

    let generatedCount = 0;

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, totalPrompts);
      const batchPrompts = sampledPrompts.prompts.slice(batchStart, batchEnd);

      console.log(`\n[RealWorker] --- BATCH ${batchIndex + 1}/${batches} ---`);
      console.log(`[RealWorker] Processing ${batchPrompts.length} prompts (indices ${batchStart}-${batchEnd - 1})`);

      // 调用 API 生成图片
      console.log(`[RealWorker] Calling Apicore API...`);
      const generationRequests = batchPrompts.map((p) => ({
        prompt: p.text,
        image: beautifyResult.imageUrl,
        n: 1,
        size: '1x1' as const,
      }));

      console.log(`[RealWorker] ========== STYLED PHOTO REQUEST PARAMS ==========`);
      console.log(`[RealWorker] Number of requests: ${generationRequests.length}`);
      generationRequests.forEach((req, idx) => {
        console.log(`[RealWorker] Request ${idx + 1}:`);
        console.log(`[RealWorker]   - Prompt: ${req.prompt.substring(0, 80)}...`);
        console.log(`[RealWorker]   - Image URL: ${req.image}`);
        console.log(`[RealWorker]   - Image length: ${req.image?.length || 0} chars`);
        console.log(`[RealWorker]   - N (count): ${req.n}`);
        console.log(`[RealWorker]   - Size: ${req.size}`);
      });
      console.log(`[RealWorker] ========== END REQUEST PARAMS ==========`);

      const imageUrls = await apicoreClient.generate(generationRequests);
      console.log(`[RealWorker] ✅ API returned ${imageUrls.length} image URLs`);

      // 🚀 並发下载和上传（並发度 5）
      const concurrency = 5;
      for (let i = 0; i < imageUrls.length; i += concurrency) {
        const batch = imageUrls.slice(i, i + concurrency);
        const batchIndices = batch.map((_, idx) => i + idx);

        console.log(`[RealWorker]   Processing concurrent batch: images ${batchIndices[0] + 1}-${batchIndices[batchIndices.length - 1] + 1}`);

        // 並发下载和上传
        const uploadPromises = batch.map(async (imageUrl, batchIdx) => {
          const globalIdx = i + batchIdx;
          const photoIndex = batchStart + globalIdx + 1;
          const objectKey = `results/${taskId}/${plan}/${String(photoIndex).padStart(3, '0')}.jpg`;

          try {
            // 下载图片
            const response = await fetch(imageUrl);
            let imageBuffer = await response.arrayBuffer();

            // 添加水印（仅 free 计划）
            if (plan === 'free') {
              console.log(`[RealWorker]   Adding watermark to image ${photoIndex}...`);
              imageBuffer = await watermarkProcessor.addWatermark(Buffer.from(imageBuffer));
            }

            // 上传到 R2
            const uploadedKey = await imageManager.uploadBuffer(
              Buffer.from(imageBuffer),
              objectKey
            );

            return {
              success: true,
              photoIndex,
              uploadedKey,
              imageUrl,
            };
          } catch (error) {
            return {
              success: false,
              photoIndex,
              error,
            };
          }
        });

        const results = await Promise.all(uploadPromises);

        // 🚀 方案 4：批量创建 Photo 记录（从 N 次查询 → 1 次查询）
        const successResults = results.filter((r) => r.success && 'uploadedKey' in r);
        const failedResults = results.filter((r) => !r.success && 'error' in r);

        if (successResults.length > 0) {
          const photosToCreate = successResults.map((result) => {
          const r = result as any;
          return {
            taskId,
            objectKey: r.uploadedKey,
            section: plan as any,
            originalName: `${plan}_${r.photoIndex}.jpg`,
            width: 1024,
            height: 1024,
            mime: 'image/jpeg',
            sizeBytes: 0,
            expiresAt: plan === 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          };
        });

          const createdCount = await createPhotosInBatch(photosToCreate);
          generatedCount += createdCount;

          successResults.forEach((result) => {
            const r = result as any;
            console.log(`[RealWorker]   ✅ Image ${r.photoIndex}: Uploaded to ${r.uploadedKey}`);
          });
        }

        failedResults.forEach((result) => {
          const r = result as any;
          console.error(`[RealWorker] ❌ Image ${r.photoIndex} failed:`, r.error);
        });

        // 更新进度
        const progress = Math.round(25 + (generatedCount / totalPrompts) * 70);
        const etaSeconds = Math.round(((totalPrompts - generatedCount) * 8) / 1);
        await updateTaskStatus(taskId, 'running', { progress, etaSeconds });

        console.log(`[RealWorker]   Progress: ${generatedCount}/${totalPrompts} (${progress}%)`);
      }
    }

    // Step 7: 完成任务
    console.log('\n[RealWorker] ========== STEP 7: FINALIZE TASK ==========');
    await updateTaskStatus(taskId, 'done', { progress: 100, etaSeconds: 0 });

    const totalPhotos = 1 + 1 + generatedCount; // uploaded + beautified + generated

    console.log(`[RealWorker] ✅ Generation completed for task: ${taskId}`);
    console.log(`[RealWorker] Total photos created: ${totalPhotos}`);
    console.log(`[RealWorker]   - Uploaded: 1`);
    console.log(`[RealWorker]   - Beautified: 1`);
    console.log(`[RealWorker]   - Generated: ${generatedCount}`);
    console.log(`[RealWorker] Processing time: ${(Date.now() - startTime) / 1000}s`);

    // 🔴 更新 Free 计划的每日配额
    if (plan === 'free') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      await quotasRepo.increment(userId, today, 1);
      console.log(`[RealWorker] ✅ Updated daily quota for user ${userId}`);
    }

    await imageManager.cleanupTempDir();
    console.log('[RealWorker] ✅ Temp directory cleaned up');
    console.log('='.repeat(80) + '\n');

    return {
      success: true,
      taskId,
      processingTime: Date.now() - startTime,
      uploadedCount: 1,
      beautifiedCount: 1,
      generatedCount,
      totalPhotos,
    };
  } catch (error) {
    console.error(`\n[RealWorker] ❌ FAILED TO PROCESS TASK ${taskId}:`, error);
    console.error('[RealWorker] Error details:', error instanceof Error ? error.stack : error);

    // 更新任务状态为错误
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskStatus(taskId, 'error', {
      errorCode: 'GENERATION_FAILED',
      errorMessage,
    });

    console.log('='.repeat(80) + '\n');
    throw error;
  }
}

/**
 * 启动 RealWorker
 */
export async function startRealWorker(): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    application_name: 'rizzify-real-worker',
  });

  try {
    console.log('[RealWorker] Starting real worker...');

    await boss.start();

    // 注册 worker 处理 task_generate 队列
    boss.work(WORKER_CONFIG.name, processImageGeneration);

    console.log('[RealWorker] Real worker started successfully');
    console.log(`[RealWorker] Team size: ${WORKER_CONFIG.teamSize}`);
    console.log(`[RealWorker] Check interval: ${WORKER_CONFIG.newJobCheckIntervalSeconds}s`);

    return boss;
  } catch (error) {
    console.error('[RealWorker] Failed to start worker:', error);
    throw error;
  }
}

// 如果直接运行此文件，启动 worker
if (require.main === module) {
  startRealWorker().catch((error) => {
    console.error('[RealWorker] Fatal error:', error);
    process.exit(1);
  });
}
