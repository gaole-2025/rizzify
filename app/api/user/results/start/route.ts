/**
 * 获取用户Start套餐完整结果的API接口
 * 支持分页查看所有Start套餐照片
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db/client'
import { authenticateUser } from '@/src/lib/auth-helpers'

// 分页参数接口
interface PaginationQuery {
  page?: string
  limit?: string
}

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const query: PaginationQuery = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20' // Start套餐每页20张
    }

    const page = Math.max(1, parseInt(query.page))
    const limit = Math.min(50, Math.max(1, parseInt(query.limit))) // 最大50条
    const offset = (page - 1) * limit

    console.log(`🔍 User Start Results API: 查询Start套餐结果 - page ${page}, limit ${limit}`)

    // 🚀 关键：使用现有的认证系统
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      console.log(`❌ User Start Results API: 用户认证失败`, authResult.error)
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const userId = authResult.user.id
    console.log(`✅ User Start Results API: 用户 ${userId} 已认证`)

    // 🚀 查询Start套餐照片 - 支持分页
    const [userStartPhotos, totalCount] = await Promise.all([
      // 查询指定页的Start照片
      db.photo.findMany({
        where: {
          task: {
            userId: userId
          },
          section: 'start'
        },
        select: {
          id: true,
          objectKey: true,
          originalName: true,
          width: true,
          height: true,
          sizeBytes: true,
          section: true,
          createdAt: true,
          task: {
            select: {
              id: true,
              plan: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),

      // 计算总数
      db.photo.count({
        where: {
          task: {
            userId: userId
          },
          section: 'start'
        }
      })
    ])

    // 🚀 数据归一化函数
    function normalizePhoto(photo: any) {
      return {
        id: photo.id,
        objectKey: photo.objectKey,
        originalName: photo.originalName,
        width: typeof photo.width === 'number' ? photo.width : undefined,
        height: typeof photo.height === 'number' ? photo.height : undefined,
        sizeBytes: typeof photo.sizeBytes === 'string' ? Number(photo.sizeBytes) :
                   typeof photo.sizeBytes === 'number' ? photo.sizeBytes : 0,
        url: `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_USER_DATA_DOMAIN || process.env.CLOUDFLARE_R2_USER_DATA_DOMAIN || 'https://cdn.rizzify.org'}/${photo.objectKey}`,
        section: photo.section,
        createdAt: photo.createdAt,
        taskId: photo.task.id,
        taskPlan: photo.task.plan,
        taskCreatedAt: photo.task.createdAt,
        expiresAt: null
      }
    }

    // 🚀 数据处理
    const startPhotos = userStartPhotos.map(normalizePhoto)

    // 构建响应数据
    const result = {
      photos: startPhotos,
      pagination: {
        page,
        limit,
        total: totalCount,
        showing: userStartPhotos.length,  // 当前页显示的数量
        hasMore: offset + userStartPhotos.length < totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        hasNextPage: offset + userStartPhotos.length < totalCount,
        hasPreviousPage: page > 1
      },
      stats: {
        totalPhotos: totalCount,
        currentPagePhotos: userStartPhotos.length,
        remainingPhotos: Math.max(0, totalCount - (offset + userStartPhotos.length)),
        cumulativePhotos: offset + userStartPhotos.length
      }
    }

    console.log(`✅ User Start Results API: 成功返回用户 ${userId} 的Start套餐结果 - page ${page}, showing ${offset + userStartPhotos.length}/${totalCount} 张照片`)

    // 🚀 添加缓存头
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5分钟私有缓存
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ User Start Results API Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to load start results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}