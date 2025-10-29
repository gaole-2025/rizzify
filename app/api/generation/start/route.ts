// @ts-nocheck
/**
 * 开始生成任务 API端点
 * POST /api/generation/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/client';
import { enqueueTaskGeneration, startBossAndEnsureQueues } from '@/lib/queue';
import { usersRepo, uploadsRepo, tasksRepo, quotasRepo } from '@/db/repo';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, createAuthErrorResponse } from '@/src/lib/auth-helpers';

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode);
    }

    const user = authResult.user!;

    // 2. 解析请求体
    const body = await request.json();
    const {
      plan,
      gender,
      fileId,
      idempotencyKey
    } = body;

    // 验证必需参数
    if (!plan || !gender || !fileId) {
      return NextResponse.json(
        { error: 'Missing required parameters: plan, gender, fileId' },
        { status: 400 }
      );
    }

    // 验证plan类型
    const validPlans = ['free', 'start', 'pro'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be one of: free, start, pro' },
        { status: 400 }
      );
    }

    // 验证gender类型
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be one of: male, female' },
        { status: 400 }
      );
    }

    // 生成或使用提供的idempotencyKey
    const finalIdempotencyKey = idempotencyKey || uuidv4();

    // 查找上传记录
    const upload = await uploadsRepo.getById(fileId);
    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found or expired' },
        { status: 404 }
      );
    }

    // 验证用户权限：只能处理自己的上传
    if (upload.userId !== user.id) {
      console.log(`❌ User ${user.email} attempted to access upload belonging to ${upload.userId}`);
      return NextResponse.json(
        { error: 'Access denied. This upload does not belong to you.' },
        { status: 403 }
      );
    }

    console.log(`🚀 User ${user.email} starting generation task: plan=${plan}, gender=${gender}`);

    // 🔴 检查 Free 计划的每日配额
    if (plan === 'free') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const quota = await quotasRepo.getForDay(user.id, today);
      
      if (quota && quota.usedCount >= 1) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        console.log(`⚠️ User ${user.email} exceeded daily free quota`);
        return NextResponse.json(
          {
            error: {
              code: 'daily_quota_exceeded',
              message: "You've reached your daily limit for the free plan. Upgrade to Start or Pro plan to generate more photos."
            }
          },
          { status: 429 }
        );
      }
    }

    // 检查是否已经存在相同的任务（幂等性检查）
    if (idempotencyKey) {
      const existingTask = await db.task.findFirst({
        where: {
          idempotencyKey: finalIdempotencyKey,
          userId: upload.userId
        }
      });

      if (existingTask) {
        return NextResponse.json({
          taskId: existingTask.id,
          status: existingTask.status,
          progress: existingTask.progress,
          message: 'Task already exists'
        });
      }
    }

    // 检查这个upload是否已经有任务了
    const existingTaskForUpload = await db.task.findUnique({
      where: { uploadId: upload.id }
    });

    if (existingTaskForUpload) {
      return NextResponse.json({
        taskId: existingTaskForUpload.id,
        status: existingTaskForUpload.status,
        progress: existingTaskForUpload.progress,
        message: 'Task already exists for this upload'
      });
    }

    // 创建数据库任务记录
    const taskData = {
      userId: upload.userId,
      uploadId: upload.id,
      plan,
      gender,
      style: 'classic',
      idempotencyKey: finalIdempotencyKey
    };

    const task = await tasksRepo.create(taskData);

    // 确保队列已启动
    await startBossAndEnsureQueues();

    try {
      // 发送任务到队列
      await enqueueTaskGeneration({
        taskId: task.id,
        userId: upload.userId,
        uploadId: upload.id,
        plan: plan as any,
        gender: gender as any,
        style: 'classic',
        fileKey: upload.objectKey,
        idempotencyKey: finalIdempotencyKey
      });
    } catch (queueError) {
      console.error('Failed to enqueue task:', queueError);

      // 如果队列投递失败，更新任务状态为错误
      await tasksRepo.updateStatus(task.id, {
        status: 'error' as any,
        errorMessage: 'Failed to queue task for processing'
      });

      throw queueError;
    }

    return NextResponse.json({
      taskId: task.id,
      userId: task.userId,
      plan: task.plan,
      gender: task.gender,
      style: task.style,
      status: task.status,
      progress: task.progress,
      idempotencyKey: task.idempotencyKey,
      createdAt: task.createdAt,
      message: 'Task queued successfully'
    });

  } catch (error) {
    console.error('Failed to start generation task:', error);
    return NextResponse.json(
      { error: 'Failed to start generation task' },
      { status: 500 }
    );
  }
}