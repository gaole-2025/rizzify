/**
 * 获取任务详情 API端点
 * GET /api/tasks/[taskId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasksRepo } from '@/db/repo';

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: { taskId: string } }) {
  try {
    const { taskId } = ctx.params

    const task = await tasksRepo.getById(taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // 返回任务状态
    return NextResponse.json({
      status: task.status,
      etaSeconds: task.etaSeconds ?? 0,
      progress: task.progress ?? 0,
      errorMessage: task.errorMessage,
      errorCode: task.errorCode
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to get task details' }, { status: 500 })
  }
}