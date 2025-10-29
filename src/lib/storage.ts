/**
 * Cloudflare R2 存储工具函数
 */

import {
  generateR2UploadUrl,
  generateR2DownloadUrl,
  copyInR2,
  deleteFromR2,
  checkR2ObjectExists,
  R2_BUCKETS
} from './r2';

export interface UploadResult {
  path: string
  fullPath: string
}

export interface DownloadOptions {
  expiresIn?: number // 默认 3600秒 (1小时)
}

/**
 * 生成上传签名URL
 */
export async function generateUploadUrl(
  bucket: string,
  path: string,
  options: {
    contentType: string
    sizeBytes?: number
  }
): Promise<{ uploadUrl: string; fileId: string }> {
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2)}`
  const uploadUrl = await generateR2UploadUrl(bucket, path, options.contentType)

  return {
    uploadUrl,
    fileId
  }
}

/**
 * 生成下载签名URL
 */
export async function generateDownloadUrl(
  bucket: string,
  path: string,
  options: DownloadOptions = {}
): Promise<{ downloadUrl: string; filename: string }> {
  const expiresIn = options.expiresIn || 3600
  const filename = path.split('/').pop() || 'download.jpg'
  const downloadUrl = await generateR2DownloadUrl(bucket, path, expiresIn)

  return {
    downloadUrl,
    filename
  }
}

/**
 * 复制文件（用于模板复制）
 */
export async function copyFile(
  sourceBucket: string,
  sourcePath: string,
  targetBucket: string,
  targetPath: string
): Promise<void> {
  await copyInR2(sourceBucket, sourcePath, targetBucket, targetPath)
}

/**
 * 删除文件
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<void> {
  await deleteFromR2(bucket, path)
}

/**
 * 检查文件是否存在
 */
export async function fileExists(
  bucket: string,
  path: string
): Promise<boolean> {
  return checkR2ObjectExists(bucket, path)
}

// 导出R2 buckets常量供其他模块使用
export { R2_BUCKETS }