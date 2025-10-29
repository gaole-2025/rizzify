// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/src/lib/auth-helpers'

// GET /api/me - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    // 使用项目标准的认证方式
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const { user } = authResult

    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 返回用户信息（符合 AuthUser schema）
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    })

  } catch (error) {
    console.error('❌ [Get User] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get user information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
