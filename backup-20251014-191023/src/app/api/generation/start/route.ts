/**
 * 开始生成任务 API端点
 * POST /api/generation/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { enqueueTaskGeneration, startBossAndEnsureQueues } from '@/lib/queue';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      plan,
      gender,
      style,
      fileKey,
      idempotencyKey,
      userPrompt
    } = body;

    // 验证必需参数
    if (!userId || !plan || !gender || !style || !fileKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, plan, gender, style, fileKey' },
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

    // 检查是否已经存在相同的任务（幂等性检查）
    if (idempotencyKey) {
      const existingTask = await prisma.task.findFirst({
        where: {
          idempotencyKey: finalIdempotencyKey,
          userId
        }
      });

      if (existingTask) {
        return NextResponse.json({
          success: true,
          data: {
            taskId: existingTask.id,
            status: existingTask.status,
            progress: existingTask.progress,
            message: 'Task already exists'
          }
        });
      }
    }

    // 创建数据库任务记录
    const task = await prisma.task.create({
      data: {
        userId,
        plan,
        gender,
        style,
        fileKey,
        idempotencyKey: finalIdempotencyKey,
        userPrompt: userPrompt || null,
        status: 'queued',
        progress: 0,
        etaSeconds: null,
        createdAt: new Date()
      }
    });

    // ✅ 确保 boss 已启动 + 队列已创建（进程首次调用会做真实启动）
    await startBossAndEnsureQueues();

    try {
      // ✅ 发送任务
      await enqueueTaskGeneration({
        taskId: task.id,
        userId,
        plan,
        gender,
        style,
        fileKey,
        idempotencyKey: finalIdempotencyKey
      });
    } catch (queueError) {
      console.error('Failed to enqueue task:', queueError);

      // 如果队列投递失败，更新任务状态为错误
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'error',
          errorMessage: 'Failed to queue task for processing'
        }
      });

      throw queueError;
    }

    return NextResponse.json({
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('Failed to start generation task:', error);
    return NextResponse.json(
      { error: 'Failed to start generation task' },
      { status: 500 }
    );
  }
}