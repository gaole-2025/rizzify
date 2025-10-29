import { db } from '../client'
import { Plan, PayStatus } from '@prisma/client'

export interface CreatePaymentData {
  userId: string
  plan: Plan
  amountUsd: number
  provider: string
  providerRef?: string
}

export const paymentsRepo = {
  async create(data: CreatePaymentData) {
    return await db.payment.create({
      data: {
        ...data,
        status: PayStatus.succeeded // 默认状态为 succeeded
      }
    })
  },

  async listByUser(userId: string) {
    return await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  },

  async updateStatus(id: string, status: PayStatus) {
    return await db.payment.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    })
  }
}