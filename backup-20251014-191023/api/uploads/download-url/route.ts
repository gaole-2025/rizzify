/**
 * 生成预签名下载URL API端点
 * POST /api/uploads/download-url
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDownloadUrl } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, path, expiresIn } = body;

    // 验证必需参数
    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters: bucket, path' },
        { status: 400 }
      );
    }

    // 设置默认过期时间为1小时
    const defaultExpiresIn = 3600;
    const finalExpiresIn = expiresIn || defaultExpiresIn;

    // 限制过期时间范围 (5分钟到24小时)
    if (finalExpiresIn < 300 || finalExpiresIn > 86400) {
      return NextResponse.json(
        { error: 'ExpiresIn must be between 300 seconds (5 minutes) and 86400 seconds (24 hours)' },
        { status: 400 }
      );
    }

    // 生成预签名下载URL
    const result = await generateDownloadUrl(bucket, path, {
      expiresIn: finalExpiresIn
    });

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        filename: result.filename,
        bucket,
        path,
        expiresIn: finalExpiresIn
      }
    });

  } catch (error) {
    console.error('Failed to generate download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}