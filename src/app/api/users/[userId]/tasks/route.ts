/**
 * 获取用户任务列表 API端点
 * GET /api/users/[userId]/tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);

    // 获取查询参数
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证分页参数
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // 构建查询条件
    const whereClause: any = {
      userId
    };

    if (status) {
      const validStatuses = ['queued', 'running', 'done', 'error'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: queued, running, done, error' },
          { status: 400 }
        );
      }
      whereClause.status = status;
    }

    if (plan) {
      const validPlans = ['free', 'start', 'pro'];
      if (!validPlans.includes(plan)) {
        return NextResponse.json(
          { error: 'Invalid plan. Must be one of: free, start, pro' },
          { status: 400 }
        );
      }
      whereClause.plan = plan;
    }

    // 计算偏移量
    const skip = (page - 1) * limit;

    // 获取任务列表和总数
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          photos: {
            select: {
              id: true,
              section: true,
              objectKey: true,
              originalName: true,
              width: true,
              height: true,
              expiresAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.task.count({
        where: whereClause
      })
    ]);

    // 格式化任务数据
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      plan: task.plan,
      gender: task.gender,
      style: task.style,
      userPrompt: task.userPrompt,
      status: task.status,
      progress: task.progress,
      etaSeconds: task.etaSeconds,
      errorCode: task.errorCode,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      idempotencyKey: task.idempotencyKey,
      photos: task.photos
    }));

    // 计算分页信息
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        tasks: formattedTasks,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPreviousPage
        }
      }
    });

  } catch (error) {
    console.error('Failed to get user tasks:', error);
    return NextResponse.json(
      { error: 'Failed to get user tasks' },
      { status: 500 }
    );
  }
}