/**
 * 批量创建 Photo 记录 - 方案 4 优化
 * 使用 createMany 替代逐个 create，减少数据库查询
 */

import { PrismaClient, Section } from '@prisma/client';

const prisma = new PrismaClient();

export interface PhotoData {
  taskId: string;
  objectKey: string;
  section: Section;
  originalName: string;
  width: number;
  height: number;
  mime: string;
  sizeBytes: number;
  expiresAt: Date | null;
}

/**
 * 批量创建 Photo 记录
 * 从 N 次查询 → 1 次查询
 */
export async function createPhotosInBatch(photos: PhotoData[]): Promise<number> {
  if (photos.length === 0) {
    console.log('[BatchPhotoCreator] No photos to create');
    return 0;
  }

  try {
    console.log(`[BatchPhotoCreator] Creating ${photos.length} photos in batch...`);
    const startTime = Date.now();

    const result = await prisma.photo.createMany({
      data: photos,
      skipDuplicates: true,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[BatchPhotoCreator] ✅ Created ${result.count} photos in ${elapsed}ms`);
    console.log(`[BatchPhotoCreator] Average: ${(elapsed / photos.length).toFixed(2)}ms per photo`);

    return result.count;
  } catch (error) {
    console.error('[BatchPhotoCreator] ❌ Failed to create photos:', error);
    throw error;
  }
}
