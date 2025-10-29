import { db } from '../client'
import { Section } from '@prisma/client'

export interface PhotosBySections {
  uploaded: Array<{
    id: string
    url: string
    section: Section
    createdAt: Date
    expiresAt: Date | null
  }>
  free: Array<{
    id: string
    url: string
    section: Section
    createdAt: Date
    expiresAt: Date | null
  }>
  start: Array<{
    id: string
    url: string
    section: Section
    createdAt: Date
    expiresAt: Date | null
  }>
  pro: Array<{
    id: string
    url: string
    section: Section
    createdAt: Date
    expiresAt: Date | null
  }>
}

export const photosRepo = {
  async listByTaskSections(taskId: string): Promise<PhotosBySections> {
    const photos = await db.photo.findMany({
      where: {
        taskId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    })

    // 按分区分组
    const result: PhotosBySections = {
      uploaded: [],
      free: [],
      start: [],
      pro: []
    }

    photos.forEach(photo => {
      const photoData = {
        id: photo.id,
        url: photo.objectKey, // 这里应该是下载URL，暂时用objectKey
        section: photo.section,
        createdAt: photo.createdAt,
        expiresAt: photo.expiresAt
      }

      result[photo.section].push(photoData)
    })

    return result
  },

  async deleteById(photoId: string) {
    return await db.photo.update({
      where: { id: photoId },
      data: { deletedAt: new Date() }
    })
  }
}