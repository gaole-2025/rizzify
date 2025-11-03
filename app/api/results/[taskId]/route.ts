/**
 * 获取任务结果和照片的API接口
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

    console.log(`🔍 Results API: 查询任务 ${taskId}`)

    // 查询任务及其关联的照片
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        photos: {
          orderBy: { createdAt: 'asc' }
        },
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
    })

    if (!task) {
      console.log(`❌ Results API: 任务不存在 ${taskId}`)
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // 检查任务是否完成
    if (task.status !== 'done') {
      console.log(`⏳ Results API: 任务未完成 ${taskId}, 状态: ${task.status}`)
      return NextResponse.json({
        error: 'Task not completed',
        status: task.status,
        progress: task.progress || 0,
        etaSeconds: task.etaSeconds
      }, { status: 400 })
    }

    // 构建结果数据
    const result = {
      task: {
        id: task.id,
        userId: task.userId,
        plan: task.plan,
        gender: task.gender,
        style: task.style,
        status: task.status,
        progress: task.progress,
        createdAt: task.createdAt,
        completedAt: task.completedAt
      },
      user: task.user,
      upload: task.upload,
      photos: task.photos.map(photo => ({
        id: photo.id,
        section: photo.section,
        objectKey: photo.objectKey,
        originalName: photo.originalName,
        width: photo.width,
        height: photo.height,
        sizeBytes: photo.sizeBytes.toString(),
        createdAt: photo.createdAt,
        expiresAt: photo.expiresAt,
        // 生成访问URL（根据实际的存储配置）
        url: `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_USER_DATA_DOMAIN || process.env.CLOUDFLARE_R2_USER_DATA_DOMAIN || 'https://cdn.rizzify.org'}/${photo.objectKey}`
      })),
      // 结果统计
      stats: {
        totalPhotos: task.photos.length,
        sections: [...new Set(task.photos.map(p => p.section))],
        completedAt: task.completedAt,
        processingTime: task.completedAt && task.createdAt
          ? task.completedAt.getTime() - task.createdAt.getTime()
          : null
      }
    }

    console.log(`✅ Results API: 成功返回任务结果 ${taskId}, ${result.photos.length} 张照片`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Results API Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to load task results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}