/**
 * 上传初始化 API端点 (前端兼容)
 * POST /api/uploads/init
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/client';
import { generateR2UploadUrl } from '@/src/lib/r2';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, createAuthErrorResponse } from '@/src/lib/auth-helpers';

/**
 * 标准化文件名为英文
 */
function standardizeFilename(originalFilename: string): string {
  // 获取文件扩展名
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? originalFilename.substring(lastDotIndex) : '';

  // 生成唯一的英文文件名
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const standardizedFilename = `image_${timestamp}_${randomId}${extension}`;

  return standardizedFilename;
}


export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode);
    }

    const user = authResult.user!;

    // 2. 解析请求体
    const body = await request.json();
    const { filename, contentType, sizeBytes } = body;

    // 验证必需参数
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing required parameters: filename, contentType' },
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

    // 生成唯一文件ID和路径
    const uploadId = uuidv4();
    const timestamp = Date.now();
    const standardizedFilename = standardizeFilename(filename);
    const objectKey = `uploads/${timestamp}-${uploadId}-${standardizedFilename}`;

    console.log(`📤 User ${user.email} uploading file: ${standardizedFilename}`);

    // 创建上传记录
    const upload = await db.upload.create({
      data: {
        id: uploadId,
        userId: user.id, // 使用真实用户ID
        filename: standardizedFilename, // 使用标准化的文件名
        contentType,
        sizeBytes: BigInt(sizeBytes || 0),
        width: 0, // 这些信息在上传完成后更新
        height: 0,
        objectKey
      }
    });

    // 生成预签名上传URL (使用 templates bucket 存储用户上传)
    const uploadUrl = await generateR2UploadUrl(
      process.env.CLOUDFLARE_R2_TEMPLATES_BUCKET || 'rizzify',
      objectKey,
      contentType,
      3600
    );

    return NextResponse.json({
      fileId: upload.id, // 返回数据库记录的ID
      uploadUrl
    });

  } catch (error) {
    console.error('Failed to initialize upload:', error);
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 500 }
    );
  }
}