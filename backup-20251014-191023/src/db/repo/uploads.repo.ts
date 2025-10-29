import { db } from '../client'

export interface CreateUploadData {
  userId: string
  filename: string
  contentType: string
  sizeBytes: number
  width: number
  height: number
  objectKey: string
}

export const uploadsRepo = {
  async create(data: CreateUploadData) {
    return await db.upload.create({
      data
    })
  },

  async getById(id: string) {
    return await db.upload.findUnique({
      where: { id }
    })
  }
}