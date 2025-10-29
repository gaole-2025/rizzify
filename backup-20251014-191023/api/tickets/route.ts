import { NextRequest, NextResponse } from 'next/server'
import { ticketsRepo, auditRepo } from '@/db/repo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, recentTaskId, message, screenshotUrls, email } = body

    // 验证必需字段
    if (!userId || !recentTaskId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, recentTaskId, message' },
        { status: 400 }
      )
    }

    // 如果是 demo-user-id，尝试获取真实的用户ID
    let finalUserId = userId

    if (userId === "demo-user-id") {
      // 尝试从任务中获取用户ID
      const { tasksRepo } = await import("@/db/repo")
      const task = await tasksRepo.getById(recentTaskId)
      if (task) {
        finalUserId = task.userId
      } else {
        // 如果找不到任务，使用默认用户ID
        finalUserId = 'd9a91dc1-6ac2-4ddd-9df6-bd7644f7cc64' // demo user ID
      }
    }

    // 创建 ticket
    const result = await ticketsRepo.create({
      userId: finalUserId,
      recentTaskId,
      message,
      screenshotUrls: screenshotUrls && screenshotUrls.length > 0 ? screenshotUrls : undefined,
      email: email?.trim() || undefined,
    })

    // 创建审计日志
    try {
      await auditRepo.append({
        actorUserId: finalUserId,
        action: 'ticket_created',
        targetType: 'ticket',
        targetId: result.ticketId,
        note: 'User created feedback ticket via web form'
      })
    } catch (auditError) {
      // 审计日志失败不应该阻止 ticket 创建
      console.error('Failed to create audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      ticketId: result.ticketId
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}