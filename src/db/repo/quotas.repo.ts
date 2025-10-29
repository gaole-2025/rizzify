import { db } from '../client'

export const quotasRepo = {
  async getForDay(userId: string, dayUtc: Date) {
    return await db.dailyQuota.findUnique({
      where: {
        userId_dayUtc: {
          userId,
          dayUtc
        }
      }
    })
  },

  async upsert(userId: string, dayUtc: Date, { usedCount }: { usedCount: number }) {
    return await db.dailyQuota.upsert({
      where: {
        userId_dayUtc: {
          userId,
          dayUtc
        }
      },
      update: {
        usedCount
      },
      create: {
        userId,
        dayUtc,
        usedCount
      }
    })
  },

  async increment(userId: string, dayUtc: Date, delta: number = 1) {
    const current = await this.getForDay(userId, dayUtc)

    if (!current) {
      return await this.upsert(userId, dayUtc, { usedCount: delta })
    }

    return await this.upsert(userId, dayUtc, { usedCount: current.usedCount + delta })
  }
}