import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/src/lib/auth-helpers'
import { db } from '@/src/db/client'

export async function GET(request: NextRequest) {
  try {
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

    // 查询用户上传的照片
    const [uploadedPhotos, totalCount] = await Promise.all([
      db.photo.findMany({
        where: {
          task: { userId: user.id },
          section: 'uploaded'
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

      db.photo.count({
        where: {
          task: { userId: user.id },
          section: 'uploaded'
        }
      })
    ])

    // 数据归一化
    const normalizedPhotos = uploadedPhotos.map(photo => ({
      id: photo.id,
      objectKey: photo.objectKey,
      originalName: photo.originalName,
      width: photo.width,
      height: photo.height,
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
          totalTasks: await db.task.count({ where: { userId: user.id } }),
          totalUploadedPhotos: totalCount,
          currentPagePhotos: normalizedPhotos.length
        }
      }
    })

  } catch (error) {
    console.error('Failed to fetch uploaded photos:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch uploaded photos',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}