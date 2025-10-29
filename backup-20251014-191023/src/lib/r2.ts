/**
 * Cloudflare R2 存储服务
 * 用于存储模板图片和生成结果
 */

import AWS from 'aws-sdk';

// R2配置
const r2Client = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  region: 'auto', // R2使用 'auto'
  signatureVersion: 'v4',
});

export const R2_BUCKETS = {
  TEMPLATES: process.env.CLOUDFLARE_R2_TEMPLATES_BUCKET || 'rizzify-templates',
  RESULTS: process.env.CLOUDFLARE_R2_RESULTS_BUCKET || 'rizzify-results',
} as const;

/**
 * 生成预签名上传URL
 */
export async function generateR2UploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  return r2Client.getSignedUrl('putObject', {
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
  });
}

/**
 * 生成预签名下载URL
 */
export async function generateR2DownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  return r2Client.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
  });
}

/**
 * 直接上传文件到R2
 */
export async function uploadToR2(
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<AWS.S3.PutObjectOutput> {
  return r2Client.upload({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }).promise();
}

/**
 * 从R2下载文件
 */
export async function downloadFromR2(
  bucket: string,
  key: string
): Promise<Buffer> {
  const result = await r2Client.getObject({
    Bucket: bucket,
    Key: key,
  }).promise();

  return result.Body as Buffer;
}

/**
 * 复制R2中的文件
 */
export async function copyInR2(
  sourceBucket: string,
  sourceKey: string,
  destBucket: string,
  destKey: string
): Promise<AWS.S3.CopyObjectOutput> {
  return r2Client.copyObject({
    Bucket: destBucket,
    Key: destKey,
    CopySource: `${sourceBucket}/${sourceKey}`,
  }).promise();
}

/**
 * 删除R2中的文件
 */
export async function deleteFromR2(
  bucket: string,
  key: string
): Promise<AWS.S3.DeleteObjectOutput> {
  return r2Client.deleteObject({
    Bucket: bucket,
    Key: key,
  }).promise();
}

/**
 * 检查文件是否存在
 */
export async function checkR2ObjectExists(
  bucket: string,
  key: string
): Promise<boolean> {
  try {
    await r2Client.headObject({
      Bucket: bucket,
      Key: key,
    }).promise();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 列出bucket中的文件
 */
export async function listR2Objects(
  bucket: string,
  prefix?: string,
  maxKeys: number = 1000
): Promise<AWS.S3.ObjectList> {
  const result = await r2Client.listObjectsV2({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  }).promise();

  return result.Contents || [];
}