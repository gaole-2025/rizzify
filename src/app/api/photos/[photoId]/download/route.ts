/**
 * 获取照片下载URL API端点
 * GET /api/photos/[photoId]/download
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateDownloadUrl, R2_BUCKETS } from '@/lib/storage';

const prisma = new PrismaClient();

interface Params {
  params: Promise<{ photoId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { photoId } = await params;

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // 从数据库获取照片详情
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        task: {
          select: {
            userId: true,
            status: true
          }
        }
      }
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // 检查照片是否已过期
    if (photo.expiresAt && photo.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Photo has expired' },
        { status: 410 }
      );
    }

    // 检查任务是否已完成
    if (photo.task.status !== 'done') {
      return NextResponse.json(
        { error: 'Task is not completed yet' },
        { status: 400 }
      );
    }

    // 解析objectKey获取bucket和path
    // objectKey格式: results/taskId/section/filename
    const pathParts = photo.objectKey.split('/');
    if (pathParts.length < 3) {
      return NextResponse.json(
        { error: 'Invalid photo objectKey format' },
        { status: 500 }
      );
    }

    // 生成下载URL (使用results bucket)
    const downloadResult = await generateDownloadUrl(
      R2_BUCKETS.RESULTS,
      photo.objectKey,
      { expiresIn: 3600 } // 1小时过期
    );

    return NextResponse.json({
      success: true,
      data: {
        photoId: photo.id,
        filename: photo.originalName,
        downloadUrl: downloadResult.downloadUrl,
        width: photo.width,
        height: photo.height,
        mime: photo.mime,
        sizeBytes: photo.sizeBytes.toString(),
        section: photo.section,
        expiresAt: photo.expiresAt,
        createdAt: photo.createdAt
      }
    });

  } catch (error) {
    console.error('Failed to generate photo download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate photo download URL' },
      { status: 500 }
    );
  }
}