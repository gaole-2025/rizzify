/**
 * 获取用户所有生成结果的API接口
 * 支持分页、筛选和统计信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db/client'
import { authenticateUser } from '@/src/lib/auth-helpers'

// 分页参数接口
interface PaginationQuery {
  page?: string
  limit?: string
  section?: string
  plan?: string
}

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const query: PaginationQuery = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      section: searchParams.get('section'),
      plan: searchParams.get('plan')
    }

    const page = Math.max(1, parseInt(query.page))
    const limit = Math.min(100, Math.max(1, parseInt(query.limit))) // 最大100条
    const offset = (page - 1) * limit

    console.log(`🔍 User Results API: 查询用户结果 - page ${page}, limit ${limit}`)

    // 🚀 关键：使用现有的认证系统
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      console.log(`❌ User Results API: 用户认证失败`, authResult.error)
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const userId = authResult.user.id
    console.log(`✅ User Results API: 用户 ${userId} 已认证`)

    // 🚀 性能优化：智能分页查询 - 根据不同section采用不同查询策略
    const [userInfo, userTasks] = await Promise.all([
      // 获取用户基本信息
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      }),

      // 获取用户任务统计和最近任务
      db.task.findMany({
        where: { userId },
        select: {
          id: true,
          plan: true,
          status: true,
          createdAt: true,
          completedAt: true,
          _count: {
            select: {
              photos: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // 最近10个任务用于显示
      })
    ])

    if (!userInfo) {
      console.log(`❌ User Results API: 用户信息不存在 ${userId}`)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 🚀 智能分页：针对不同section采用不同查询策略
    const [
      uploadedPhotos,
      freePhotos,
      startPhotos,
      proPhotos
    ] = await Promise.all([
      // uploaded: 全部查询 - 用户最关心原图
      db.photo.findMany({
        where: {
          task: { userId },
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
        orderBy: { createdAt: 'desc' }
      }),

      // free: 全部查询 - 只有2张，性能影响小
      db.photo.findMany({
        where: {
          task: { userId },
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
        orderBy: { createdAt: 'desc' }
      }),

      // start: 只查询最新10张 - 预览用
      db.photo.findMany({
        where: {
          task: { userId },
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
        take: 10
      }),

      // pro: 只查询最新10张 - 预览用
      db.photo.findMany({
        where: {
          task: { userId },
          section: 'pro'
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
        take: 10
      })
    ])

    // 🚀 并行计算各section总数
    const [
      uploadedCount,
      freeCount,
      startCount,
      proCount
    ] = await Promise.all([
      db.photo.count({
        where: {
          task: { userId },
          section: 'uploaded'
        }
      }),
      db.photo.count({
        where: {
          task: { userId },
          section: 'free'
        }
      }),
      db.photo.count({
        where: {
          task: { userId },
          section: 'start'
        }
      }),
      db.photo.count({
        where: {
          task: { userId },
          section: 'pro'
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

    // 🚀 优化：使用直接查询结果，避免重复数据处理
    const allUploadedPhotos = uploadedPhotos.map(normalizePhoto)
    const allFreePhotos = freePhotos.map(normalizePhoto)
    const previewStartPhotos = startPhotos.map(normalizePhoto)
    const previewProPhotos = proPhotos.map(normalizePhoto)

    // 🚀 构建智能响应数据
    const result = {
      user: userInfo,
      stats: {
        totalTasks: userTasks.length,
        totalPhotos: uploadedCount + freeCount + startCount + proCount,
        completedTasks: userTasks.filter(t => t.status === 'done').length,
        sectionCounts: {
          uploaded: uploadedCount,
          free: freeCount,
          start: startCount,
          pro: proCount
        },
        lastGeneratedAt: userTasks[0]?.createdAt || null
      },
      photos: {
        uploaded: allUploadedPhotos, // 全部上传照片
        free: allFreePhotos,     // 全部Free照片（只有2张）
        start: previewStartPhotos, // 最新10张Start照片预览
        pro: previewProPhotos      // 最新10张Pro照片预览
      },
      // 🚀 新增：分页信息 - 用于显示"查看全部"功能
      pagination: {
        start: {
          showing: previewStartPhotos.length,
          total: startCount,
          hasMore: startCount > 10
        },
        pro: {
          showing: previewProPhotos.length,
          total: proCount,
          hasMore: proCount > 10
        }
      },
      recentTasks: userTasks.map(task => ({
        id: task.id,
        plan: task.plan,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        photoCount: task._count.photos,
        previewImage: null // TODO: 可以选择每个任务的预览图
      }))
    }

    console.log(`✅ User Results API: 智能分页返回用户 ${userId} 的结果 - uploaded:${uploadedCount}, free:${freeCount}, start:${previewStartPhotos.length}/${startCount}, pro:${previewProPhotos.length}/${proCount}`)

    // 🚀 添加缓存头
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5分钟私有缓存
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ User Results API Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to load user results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}