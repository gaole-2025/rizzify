/**
 * 上传探测 API端点
 * POST /api/uploads/probe
 * 确认文件是否已成功上传
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/client';
import { checkR2ObjectExists, R2_BUCKETS } from '@/src/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, width, height, sizeMB } = body;

    // 验证必需参数
    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileId' },
        { status: 400 }
      );
    }

    // 从数据库查找上传记录
    const upload = await db.upload.findUnique({
      where: { id: fileId },
    });

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload record not found' },
        { status: 404 }
      );
    }

    // 检查文件是否在R2中存在
    const existsInR2 = await checkR2ObjectExists(
      R2_BUCKETS.TEMPLATES,
      upload.objectKey
    );

    if (!existsInR2) {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      );
    }

    // 更新上传记录，添加图像元数据
    await db.upload.update({
      where: { id: fileId },
      data: {
        width: width || 0,
        height: height || 0,
        sizeBytes: sizeMB ? BigInt(Math.round(sizeMB * 1024 * 1024)) : upload.sizeBytes,
      },
    });

    // 文件已成功上传并更新
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to probe upload:', error);
    return NextResponse.json(
      { error: 'Failed to probe upload' },
      { status: 500 }
    );
  }
}