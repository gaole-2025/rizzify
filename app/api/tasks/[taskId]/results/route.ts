/**
 * 获取任务结果和照片的API接口 - 正确路径
 */

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    console.log(`🔍 Task Results API: 查询任务 ${taskId}`)

    // 🚀 优化：并行查询任务和照片数据，减少数据库查询时间
    const [task, photos] = await Promise.all([
      db.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          userId: true,
          plan: true,
          gender: true,
          style: true,
          status: true,
          progress: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          upload: {
            select: {
              id: true,
              filename: true,
              objectKey: true,
              width: true,
              height: true
            }
          }
        }
      }),
      db.photo.findMany({
        where: { taskId },
        select: {
          id: true,
          objectKey: true,
          originalName: true,
          width: true,
          height: true,
          sizeBytes: true,
          section: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' }
      })
    ])

    // 如果任务不存在，返回404
    if (!task) {
      console.log(`❌ Task Results API: 任务不存在 ${taskId}`)
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // 检查任务是否完成
    if (task.status !== 'done') {
      console.log(`⏳ Task Results API: 任务未完成 ${taskId}, 状态: ${task.status}`)
      return NextResponse.json({
        error: 'Task not completed',
        status: task.status,
        progress: task.progress || 0,
        etaSeconds: task.etaSeconds
      }, { status: 400 })
    }

    // 数据归一化函数：按照GPT建议补齐section字段和修正sizeBytes类型
    function normalizePhoto(section: 'uploaded'|'free'|'start'|'pro', photo: any) {
      return {
        id: photo.id,
        objectKey: photo.objectKey,
        originalName: photo.originalName,
        width: typeof photo.width === 'number' ? photo.width : undefined,
        height: typeof photo.height === 'number' ? photo.height : undefined,
        sizeBytes: typeof photo.sizeBytes === 'string' ? Number(photo.sizeBytes) :
                   typeof photo.sizeBytes === 'number' ? photo.sizeBytes : 0,
        url: `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_USER_DATA_DOMAIN || process.env.CLOUDFLARE_R2_USER_DATA_DOMAIN || 'https://cdn.rizzify.org'}/${photo.objectKey}`,
        createdAt: photo.createdAt,
        section: section,  // 关键：补齐section字段
        expiresAt: null    // 补齐expiresAt字段
      }
    }

    // 🚀 优化：使用更高效的分组方式，避免多次filter操作
    const photosBySection = photos.reduce((acc, photo) => {
      if (!acc[photo.section]) {
        acc[photo.section] = []
      }
      acc[photo.section].push(normalizePhoto(photo.section as any, photo))
      return acc
    }, {} as Record<string, any[]>)

    const uploaded = photosBySection.uploaded || []
    const free = photosBySection.free || []
    const start = photosBySection.start || []
    const pro = photosBySection.pro || []

    // 构建符合前端期望的结果数据
    const result = {
      task: {
        id: task.id,
        userId: task.userId,
        plan: task.plan,
        gender: task.gender,
        style: task.style,
        status: task.status,
        progress: task.progress,
        total: photos.length, // 照片总数
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt
      },
      user: task.user,
      upload: task.upload,
      // 按section分类的照片数组
      uploaded,
      free,
      start,
      pro,
      // 统计信息
      stats: {
        totalPhotos: photos.length,
        sections: [...new Set(photos.map(p => p.section))],
        completedAt: task.completedAt,
        processingTime: task.completedAt && task.createdAt
          ? task.completedAt.getTime() - task.createdAt.getTime()
          : null
      }
    }

    console.log(`✅ Task Results API: 成功返回任务结果 ${taskId}, ${photos.length} 张照片`)

    // 🚀 优化：添加缓存头，提升后续请求性能
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5分钟客户端缓存，10分钟CDN缓存
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ Task Results API Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to load task results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}