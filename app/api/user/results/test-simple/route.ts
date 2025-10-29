/**
 * 最简化的API测试 - 用于诊断性能问题
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/src/lib/auth-helpers'
import { db } from '@/src/db/client'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log(`🚀 [Test Simple] API call started at ${startTime}`)

    // 认证测试
    const authStart = Date.now()
    const authResult = await authenticateUser(request)
    const authTime = Date.now() - authStart
    console.log(`🔐 [Test Simple] Authentication time: ${authTime}ms`)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const { user } = authResult
    console.log(`✅ [Test Simple] User authenticated: ${user.id}`)

    // 最简单的数据库查询测试
    const dbStart = Date.now()
    const userExists = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true }
    })
    const dbTime = Date.now() - dbStart
    console.log(`🗄️  [Test Simple] Simple DB query time: ${dbTime}ms`)

    const totalTime = Date.now() - startTime
    console.log(`⏱️  [Test Simple] Total API time: ${totalTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Simple test completed',
        user: {
          id: userExists?.id,
          email: userExists?.email
        },
        timings: {
          auth: authTime,
          database: dbTime,
          total: totalTime
        }
      }
    })

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ [Test Simple] Error after ${totalTime}ms:`, error)

    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timing: totalTime
      },
      { status: 500 }
    )
  }
}