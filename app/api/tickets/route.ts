// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { ticketsRepo, auditRepo } from '@/db/repo'
import { authenticateUser } from '@/src/lib/auth-helpers'
import { db } from '@/src/db/client'
import { uploadToR2, R2_BUCKETS } from '@/src/lib/r2'
import { v4 as uuidv4 } from 'uuid'

// R2 公开域名配置
const R2_USER_DATA_DOMAIN =
  process.env.CLOUDFLARE_R2_USER_DATA_DOMAIN ||
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_USER_DATA_DOMAIN ||
  'https://rizzify.org'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, recentTaskId, message, screenshotUrls, email } = body

    // 验证必需字段
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, message' },
        { status: 400 }
      )
    }

    // 优先使用认证用户ID，其次使用传入的 userId
    let finalUserId = userId
    try {
      const auth = await authenticateUser(request)
      if (auth?.success && auth.user?.id) {
        finalUserId = auth.user.id
      }
    } catch {}

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

    let finalRecentTaskId: string | undefined = undefined
    if (recentTaskId) {
      const { tasksRepo } = await import("@/db/repo")
      const t = await tasksRepo.getById(recentTaskId)
      if (t && t.userId === finalUserId) {
        finalRecentTaskId = t.id
      } else {
        const latest = await tasksRepo.listByUser(finalUserId, 1)
        if (latest && latest.length > 0) {
          finalRecentTaskId = latest[0].id
        }
      }
    }

    // 关联邮箱：优先使用请求体中的 email，否则回退为该用户在DB中的邮箱
    let finalEmail = (email?.trim() || undefined) as string | undefined
    if (!finalEmail && finalUserId) {
      const userRow = await db.user.findUnique({ where: { id: finalUserId }, select: { email: true } })
      if (userRow?.email) {
        finalEmail = userRow.email
      }
    }

    // 上传截图到 R2 feedback 文件夹，只存储 URL
    let finalScreenshotUrls: string[] = []
    if (screenshotUrls && screenshotUrls.length > 0) {
      const timestamp = Date.now()
      for (const base64Data of screenshotUrls) {
        try {
          // 解析 base64 数据
          const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
          if (!matches) continue
          const mimeType = matches[1]
          const buffer = Buffer.from(matches[2], 'base64')
          
          // 生成唯一的文件名（与 uploads 文件夹结构一致）
          const ext = mimeType.split('/')[1] || 'jpg'
          const filename = `feedback/${timestamp}-${uuidv4()}.${ext}`
          
          // 上传到 R2 RESULTS bucket
          await uploadToR2(R2_BUCKETS.RESULTS, filename, buffer, mimeType)
          
          // 生成公开 URL
          const publicUrl = `${R2_USER_DATA_DOMAIN}/${filename}`
          finalScreenshotUrls.push(publicUrl)
        } catch (err) {
          console.error('Failed to upload screenshot to R2:', err)
          // 继续处理其他截图，不中断流程
        }
      }
    }

    // 创建 ticket（只存储 R2 URL，不存储 base64）
    const result = await ticketsRepo.create({
      userId: finalUserId,
      recentTaskId: finalRecentTaskId,
      message,
      screenshotUrls: finalScreenshotUrls.length > 0 ? finalScreenshotUrls : undefined,
      email: finalEmail,
    })

    // 注：AuditLog 仅支持 Task 关联，ticket 不需要审计日志
    // 如需 ticket 审计，需扩展 AuditLog 模型支持多种 targetType

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