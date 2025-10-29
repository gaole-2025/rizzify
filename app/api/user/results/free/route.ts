import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/src/lib/auth-helpers'
import { db } from '@/src/db/client'

// 🚀 查询用户Free套餐结果 - 专用接口
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log(`📊 [Results Free] Fetching free photos for user ${user.id}, page ${page}`)

    // 🚀 并行查询：Free照片 + 统计信息
    const [
      freePhotos,
      totalCount,
      userTasks
    ] = await Promise.all([
      // 查询Free套餐照片（Free通常只有2张，所以查询全部）
      db.photo.findMany({
        where: {
          task: { userId: user.id },
          section: 'free'
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
        skip: (page - 1) * limit,
        take: limit
      }),

      // 查询总数
      db.photo.count({
        where: {
          task: { userId: user.id },
          section: 'free'
        }
      }),

      // 查询用户Free任务统计
      db.task.count({
        where: {
          userId: user.id,
          plan: 'free'
        }
      })
    ])

    // 🚀 数据归一化
    const normalizedPhotos = freePhotos.map(photo => ({
      id: photo.id,
      objectKey: photo.objectKey,
      originalName: photo.originalName,
      width: typeof photo.width === 'number' ? photo.width : undefined,
      height: typeof photo.height === 'number' ? photo.height : undefined,
      sizeBytes: typeof photo.sizeBytes === 'bigint' ? Number(photo.sizeBytes) :
                 typeof photo.sizeBytes === 'number' ? photo.sizeBytes : 0,
      url: `https://rizzify.org/${photo.objectKey}`,
      section: photo.section,
      createdAt: photo.createdAt,
      taskId: photo.task.id,
      taskPlan: photo.task.plan,
      taskCreatedAt: photo.task.createdAt,
      expiresAt: null
    }))

    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    console.log(`✅ [Results Free] Returned ${normalizedPhotos.length} free photos for user ${user.id}`)

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        photos: normalizedPhotos,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasMore,
          currentPage: page,
          hasNextPage: hasMore,
          hasPreviousPage: page > 1
        },
        stats: {
          totalFreeTasks: userTasks,
          totalFreePhotos: totalCount,
          currentPagePhotos: normalizedPhotos.length,
          // Free套餐特性：通常只有2张照片
          note: totalCount <= 2 ? 'All free photos displayed' : `Showing ${normalizedPhotos.length} of ${totalCount} free photos`
        }
      }
    })

  } catch (error) {
    console.error('❌ [Results Free] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch free photos',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}