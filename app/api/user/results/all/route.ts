/**
 * 统一获取用户所有结果的 API 接口 - 性能优化版本
 * 合并所有 section 的查询，减少数据库调用
 * 从 16-20 次查询 → 2-3 次查询
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db/client'
import { authenticateUser } from '@/src/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [Results All] Starting unified results fetch...')

    // 认证用户
    const authResult = await authenticateUser(request)
    if (!authResult.success) {
      console.log(`❌ [Results All] Auth failed:`, authResult.error)
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const userId = authResult.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      )
    }
    console.log(`✅ [Results All] User ${userId} authenticated`)

    // 🚀 优化：一次查询获取所有照片 + 统计
    const startTime = Date.now()

    const [allPhotos, userInfo, userTasks] = await Promise.all([
      // 一次查询获取所有照片（按 section 分组）
      db.photo.findMany({
        where: {
          task: { userId }
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

      // 获取用户信息
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      }),

      // 获取用户任务统计
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
        take: 10
      })
    ])

    const queryTime = Date.now() - startTime
    console.log(`⚡ [Results All] Database queries completed in ${queryTime}ms`)

    if (!userInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 🚀 数据归一化函数
    const normalizePhoto = (photo: any) => ({
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
    })

    // 🚀 按 section 分组照片
    const photosBySection = {
      uploaded: [] as any[],
      free: [] as any[],
      start: [] as any[],
      pro: [] as any[]
    }

    const sectionCounts = {
      uploaded: 0,
      free: 0,
      start: 0,
      pro: 0
    }

    // 分组并统计
    for (const photo of allPhotos) {
      const normalized = normalizePhoto(photo)
      const section = photo.section as keyof typeof photosBySection

      if (photosBySection[section]) {
        photosBySection[section].push(normalized)
        sectionCounts[section]++
      }
    }

    // 🚀 预览数据：uploaded 和 free 全部，start/pro 取前 20 张（与分页 limit 一致）
    const previewPhotos = {
      uploaded: photosBySection.uploaded,
      free: photosBySection.free,
      start: photosBySection.start.slice(0, 20),
      pro: photosBySection.pro.slice(0, 20)
    }

    // 构建响应
    const completedTasks = userTasks.filter(t => t.status === 'done')
    const generatedPhotos = sectionCounts.free + sectionCounts.start + sectionCounts.pro
    
    const result = {
      user: userInfo,
      stats: {
        totalTasks: completedTasks.length,
        totalPhotos: generatedPhotos,
        completedTasks: completedTasks.length,
        sectionCounts,
        lastGeneratedAt: completedTasks[0]?.createdAt || null
      },
      photos: previewPhotos,
      pagination: {
        start: {
          showing: previewPhotos.start.length,
          total: sectionCounts.start,
          hasMore: sectionCounts.start > 20
        },
        pro: {
          showing: previewPhotos.pro.length,
          total: sectionCounts.pro,
          hasMore: sectionCounts.pro > 20
        }
      },
      recentTasks: userTasks.map(task => ({
        id: task.id,
        plan: task.plan,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        photoCount: task._count.photos,
        previewImage: null
      }))
    }

    console.log(`✅ [Results All] Unified response ready - uploaded:${sectionCounts.uploaded}, free:${sectionCounts.free}, start:${previewPhotos.start.length}/${sectionCounts.start}, pro:${previewPhotos.pro.length}/${sectionCounts.pro}`)

    // 🚀 不使用缓存，确保每次都获取最新数据
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ [Results All] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load user results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
