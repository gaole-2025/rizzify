import { db } from '../src/db/client'

/**
 * 清理过期照片脚本
 * 删除 expiresAt < now 或 deletedAt 不为空的照片记录
 * 注意：不做对象存储删除，仅打印日志占位
 */
async function cleanupExpiredPhotos() {
  console.log('🧹 Starting cleanup of expired photos...')
  // UTC 02:00 为刷新基准
  console.log('🕐 Running cleanup at:', new Date().toISOString())

  try {
    const now = new Date()

    // 1. 查找过期照片 (expiresAt < now)
    const expiredPhotos = await db.photo.findMany({
      where: {
        expiresAt: {
          lt: now
        },
        deletedAt: null // 只处理未被软删除的过期照片
      }
    })

    console.log(`📊 Found ${expiredPhotos.length} expired photos`)

    // 2. 软删除过期照片
    let expiredDeletedCount = 0
    for (const photo of expiredPhotos) {
      await db.photo.update({
        where: { id: photo.id },
        data: { deletedAt: now }
      })
      expiredDeletedCount++
      console.log(`🗑️  Marked expired photo as deleted: ${photo.id} (objectKey: ${photo.objectKey})`)

      // TODO: 这里应该添加对象存储删除逻辑
      // console.log(`📦 Should delete from object storage: ${photo.objectKey}`)
    }

    // 3. 查找已经被软删除的照片 (deletedAt 不为空)
    const softDeletedPhotos = await db.photo.findMany({
      where: {
        deletedAt: {
          not: null
        }
      }
    })

    console.log(`📊 Found ${softDeletedPhotos.length} soft-deleted photos in total`)

    // 4. 统计各分区过期情况
    const expiredBySection = await db.photo.groupBy({
      by: ['section'],
      where: {
        expiresAt: {
          lt: now
        },
        deletedAt: null
      },
      _count: {
        id: true
      }
    })

    console.log('📈 Expired photos by section:')
    expiredBySection.forEach(section => {
      console.log(`  - ${section.section}: ${section._count.id} photos`)
    })

    // 5. 统计总体情况
    const totalPhotos = await db.photo.count()
    const activePhotos = await db.photo.count({
      where: {
        deletedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } }
        ]
      }
    })

    console.log('📊 Overall photo statistics:')
    console.log(`  - Total photos: ${totalPhotos}`)
    console.log(`  - Active photos: ${activePhotos}`)
    console.log(`  - Soft-deleted photos: ${softDeletedPhotos.length}`)
    console.log(`  - Newly marked as expired: ${expiredDeletedCount}`)

    console.log('✅ Cleanup completed successfully!')
    console.log('🔗 Object storage cleanup should be handled separately')

  } catch (error) {
    console.error('❌ Photo cleanup failed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the cleanup
cleanupExpiredPhotos().catch(console.error)