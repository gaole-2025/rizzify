import fs from 'fs/promises';
import path from 'path';
// Use native fetch in Node.js 18+
const fetch = globalThis.fetch;
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface ImageManagerOptions {
  r2Endpoint: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2ResultsBucket: string;
  tempDir?: string;
}

class ImageManager {
  private s3Client: S3Client;
  private r2ResultsBucket: string;
  private tempDir: string;

  constructor(options: ImageManagerOptions) {
    this.r2ResultsBucket = options.r2ResultsBucket;
    this.tempDir = options.tempDir || path.join(process.cwd(), '.tmp');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: options.r2Endpoint,
      credentials: {
        accessKeyId: options.r2AccessKeyId,
        secretAccessKey: options.r2SecretAccessKey,
      },
    });
  }

  /**
   * Download image from URL to local temp file
   */
  async downloadImage(imageUrl: string, fileName: string): Promise<string> {
    try {
      console.log(`[ImageManager] Downloading image from URL...`);
      console.log(`[ImageManager]   - URL: ${imageUrl.substring(0, 80)}...`);
      console.log(`[ImageManager]   - Temp file: ${fileName}`);
      
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log(`[ImageManager]   - Temp dir: ${this.tempDir}`);

      const filePath = path.join(this.tempDir, fileName);
      const startTime = Date.now();
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);
      
      const elapsed = Date.now() - startTime;
      console.log(`[ImageManager] ✅ Downloaded ${buffer.length} bytes in ${elapsed}ms`);
      console.log(`[ImageManager]   - Saved to: ${filePath}`);

      return filePath;
    } catch (error) {
      console.error('[ImageManager] ❌ Download failed:', error);
      throw error;
    }
  }

  /**
   * Upload image to R2
   */
  async uploadToR2(filePath: string, objectKey: string): Promise<string> {
    try {
      console.log(`[ImageManager] Uploading to R2...`);
      console.log(`[ImageManager]   - Bucket: ${this.r2ResultsBucket}`);
      console.log(`[ImageManager]   - Object key: ${objectKey}`);
      console.log(`[ImageManager]   - Local file: ${filePath}`);
      
      const fileBuffer = await fs.readFile(filePath);
      const fileSize = fileBuffer.length;
      console.log(`[ImageManager]   - File size: ${fileSize} bytes`);

      const startTime = Date.now();
      const command = new PutObjectCommand({
        Bucket: this.r2ResultsBucket,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: 'image/jpeg',
      });

      await this.s3Client.send(command);
      const elapsed = Date.now() - startTime;

      console.log(`[ImageManager] ✅ Uploaded in ${elapsed}ms`);
      return objectKey;
    } catch (error) {
      console.error('[ImageManager] ❌ Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload buffer directly to R2
   */
  async uploadBuffer(buffer: Buffer, objectKey: string): Promise<string> {
    try {
      console.log(`[ImageManager] Uploading buffer to R2...`);
      console.log(`[ImageManager]   - Bucket: ${this.r2ResultsBucket}`);
      console.log(`[ImageManager]   - Object key: ${objectKey}`);
      console.log(`[ImageManager]   - Buffer size: ${buffer.length} bytes`);

      const startTime = Date.now();
      const command = new PutObjectCommand({
        Bucket: this.r2ResultsBucket,
        Key: objectKey,
        Body: buffer,
        ContentType: 'image/jpeg',
      });

      await this.s3Client.send(command);
      const elapsed = Date.now() - startTime;

      console.log(`[ImageManager] ✅ Buffer uploaded in ${elapsed}ms`);
      return objectKey;
    } catch (error) {
      console.error('[ImageManager] ❌ Buffer upload failed:', error);
      throw error;
    }
  }

  /**
   * Download and upload image in one go
   */
  async downloadAndUpload(imageUrl: string, objectKey: string, fileName?: string): Promise<string> {
    const tempFileName = fileName || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

    try {
      console.log(`\n[ImageManager] ========== DOWNLOAD AND UPLOAD START ==========`);
      const startTime = Date.now();
      
      const localPath = await this.downloadImage(imageUrl, tempFileName);
      const uploadedKey = await this.uploadToR2(localPath, objectKey);
      await this.cleanupFile(localPath);
      
      const elapsed = Date.now() - startTime;
      console.log(`[ImageManager] ✅ Download and upload completed in ${elapsed}ms`);
      console.log(`[ImageManager] ========== DOWNLOAD AND UPLOAD COMPLETED ==========\n`);
      
      return uploadedKey;
    } catch (error) {
      console.error('[ImageManager] ❌ Download and upload failed:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary file
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`[ImageManager] ✅ Cleaned up: ${path.basename(filePath)}`);
    } catch (error) {
      console.warn('[ImageManager] ⚠️  Cleanup warning:', error);
    }
  }

  /**
   * Clean up all temporary files
   */
  async cleanupTempDir(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      console.log(`[ImageManager] Cleaning up temp directory (${files.length} files)...`);
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        await fs.unlink(filePath);
      }
      console.log('[ImageManager] ✅ Temp directory cleaned up');
    } catch (error) {
      console.warn('[ImageManager] ⚠️  Cleanup temp dir warning:', error);
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      console.error('[ImageManager] Failed to get file size:', error);
      throw error;
    }
  }

  /**
   * Get image dimensions (basic check)
   */
  async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    // For now, return default dimensions
    // In production, use a library like 'sharp' to get actual dimensions
    return { width: 1024, height: 1024 };
  }
}

export function createImageManager(): ImageManager {
  const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const r2ResultsBucket = process.env.CLOUDFLARE_R2_RESULTS_BUCKET;

  if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey || !r2ResultsBucket) {
    throw new Error('Missing R2 configuration');
  }

  return new ImageManager({
    r2Endpoint,
    r2AccessKeyId,
    r2SecretAccessKey,
    r2ResultsBucket,
  });
}

export const imageManager = createImageManager();
