/**
 * 埋点追踪 API
 * POST /api/analytics/track
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db/client'

interface TrackRequest {
  sessionId: string
  userId?: string
  eventType: string
  eventData?: Record<string, any>
  pagePath?: string
  referrer?: string
  userAgent?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackRequest = await request.json()
    const {
      sessionId,
      userId,
      eventType,
      eventData,
      pagePath,
      referrer,
      userAgent,
    } = body

    // 基本验证
    if (!sessionId || !eventType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 解析设备类型
    const deviceType = getDeviceType(userAgent || '')

    // 1. 插入事件（异步，不阻塞响应）
    const eventPromise = db.userEvent.create({
      data: {
        sessionId,
        userId: userId || null,
        eventType,
        eventData: eventData || {},
        pagePath: pagePath || null,
        referrer: referrer || null,
        userAgent: userAgent || null,
        deviceType,
      },
    })

    // 2. 更新会话信息（异步）
    const sessionPromise = db.userSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: userId || null,
        firstPage: pagePath || null,
        lastPage: pagePath || null,
        referrer: referrer || null,
        deviceType,
        totalEvents: 1,
      },
      update: {
        userId: userId || undefined,
        lastPage: pagePath || undefined,
        lastActivityAt: new Date(),
        totalEvents: { increment: 1 },
      },
    })

    // 并行执行，但不等待完成（fire and forget）
    Promise.all([eventPromise, sessionPromise]).catch((error) => {
      console.error('Analytics DB error:', error)
    })

    // 立即返回成功，不等待数据库操作完成
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // 即使出错也返回成功，不影响前端
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

/**
 * 根据 User-Agent 判断设备类型
 */
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile'
  }
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet'
  }
  
  return 'desktop'
}
