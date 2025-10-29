import { db } from '../client'

export interface CreateAuditData {
  actorUserId?: string
  action: string
  targetType: string
  targetId: string
  note?: string
}

export const auditRepo = {
  async append(data: CreateAuditData) {
    return await db.auditLog.create({
      data
    })
  },

  async listByTarget(targetType: string, targetId: string, limit: number = 100) {
    return await db.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
}