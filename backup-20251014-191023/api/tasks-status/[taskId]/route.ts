/**
 * 任务状态查询 API端点 (独立简化版本)
 * GET /api/tasks-status/[taskId]
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: { taskId: string } }) {
  try {
    const { taskId } = ctx.params

    // 简单的模拟响应，避免复杂的逻辑
    return NextResponse.json({
      status: 'processing',
      etaSeconds: 45,
      progress: 65,
      taskId: taskId
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to get task status' }, { status: 500 })
  }
}