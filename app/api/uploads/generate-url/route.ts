/**
 * 生成预签名上传URL API端点
 * POST /api/uploads/generate-url
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, path, contentType, sizeBytes } = body;

    // 验证必需参数
    if (!bucket || !path || !contentType) {
      return NextResponse.json(
        { error: 'Missing required parameters: bucket, path, contentType' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB限制)
    if (sizeBytes && sizeBytes > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      );
    }

    // 生成预签名上传URL
    const result = await generateUploadUrl(bucket, path, {
      contentType,
      sizeBytes
    });

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        fileId: result.fileId,
        bucket,
        path
      }
    });

  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}