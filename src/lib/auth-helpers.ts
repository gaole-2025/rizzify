/**
 * 认证辅助函数
 * 提供用户认证验证和用户信息获取功能
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/src/db/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * 从请求中提取用户信息
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    // 1. 尝试从Authorization header获取token
    const authHeader = request.headers.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 2. 尝试从cookie获取token (Supabase默认存储方式)
      const cookies = request.headers.get('cookie') || '';
      const match = cookies.match(/sb-access-token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      console.log('No authentication token found');
      return null;
    }

    // 3. 验证token并获取用户信息
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Invalid token:', error?.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * 确保用户在本地数据库中存在记录
 */
export async function ensureUserInDatabase(supabaseUser: any) {
  try {
    // 1. 首先尝试通过email查找用户
    let user = await db.user.findUnique({
      where: { email: supabaseUser.email! }
    });

    // 2. 如果不存在，创建新用户
    if (!user) {
      console.log(`Creating new user record for: ${supabaseUser.email}`);
      user = await db.user.create({
        data: {
          id: supabaseUser.id, // 使用Supabase用户ID
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          avatarUrl: supabaseUser.user_metadata?.avatar_url,
          authProv: 'supabase'
        }
      });
    } else {
      // 3. 如果用户已存在，更新信息（可选）
      if (user.id !== supabaseUser.id) {
        console.log(`User ID mismatch - updating local user ID for: ${supabaseUser.email}`);
        // 这里可能需要处理ID不匹配的情况
        // 暂时保持现有逻辑
      }
    }

    return user;
  } catch (error) {
    console.error('Error ensuring user in database:', error);
    throw error;
  }
}

/**
 * API认证中间件 - 获取用户信息并确保本地记录存在
 */
export async function authenticateUser(request: NextRequest) {
  try {
    // 1. 从请求中获取用户
    const supabaseUser = await getUserFromRequest(request);

    if (!supabaseUser) {
      return {
        success: false,
        error: 'Unauthorized - No valid authentication token found',
        statusCode: 401
      };
    }

    // 2. 确保用户在本地数据库中存在
    const localUser = await ensureUserInDatabase(supabaseUser);

    return {
      success: true,
      user: localUser,
      supabaseUser
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500
    };
  }
}

/**
 * 创建标准化的错误响应
 */
export function createAuthErrorResponse(message: string, statusCode: number = 401) {
  return new Response(
    JSON.stringify({
      error: message,
      code: 'AUTH_ERROR'
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}