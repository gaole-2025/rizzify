/**
 * 用户同步 API端点
 * POST /api/auth/sync-user
 * 确保Supabase用户在本地数据库中有对应记录
 */

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/src/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: 'AUTH_ERROR'
        },
        { status: authResult.statusCode }
      );
    }

    const { user, supabaseUser } = authResult;

    // 2. 返回用户信息
    return NextResponse.json({
      success: true,
      message: 'User synchronized successfully',
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        authProv: user.authProv,
        createdAt: user.createdAt
      } : null,
      supabaseInfo: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        metadata: supabaseUser.user_metadata
      }
    });

  } catch (error) {
    console.error('Error in user sync API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sync-user
 * 获取当前同步的用户信息
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户认证
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: 'AUTH_ERROR'
        },
        { status: authResult.statusCode }
      );
    }

    const { user, supabaseUser } = authResult;

    // 2. 返回用户信息
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        authProv: user.authProv,
        createdAt: user.createdAt
      },
      supabaseInfo: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        metadata: supabaseUser.user_metadata
      }
    });

  } catch (error) {
    console.error('Error in user sync GET API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}