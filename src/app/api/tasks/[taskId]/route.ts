/**
 * 获取任务详情 API端点
 * GET /api/tasks/[taskId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs'

const prisma = new PrismaClient();

export async function GET(_req: NextRequest, ctx: { params: { taskId: string } }) {
  try {
    const { taskId } = ctx.params

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      // 如果这里关系名和 schema 不一致，会抛错，先最小化返回再逐步加
      // include: { photos: { orderBy: { createdAt: 'asc' } } },
    })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // 最小化返回，先让轮询不报错
    return NextResponse.json({
      status: task.status,
      etaSeconds: task.etaSeconds ?? 0,
      progress: task.progress ?? 0
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to get task details' }, { status: 500 })
  }
}