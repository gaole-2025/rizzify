import { db } from '../client'

export interface CreateUserData {
  name?: string
  avatarUrl?: string
}

export const usersRepo = {
  async getByEmail(email: string) {
    return await db.user.findUnique({
      where: { email }
    })
  },

  async create(email: string, data: CreateUserData = {}) {
    return await db.user.create({
      data: {
        email,
        ...data
      }
    })
  }
}