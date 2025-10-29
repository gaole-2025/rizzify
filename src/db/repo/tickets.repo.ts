import { db } from '../client'
import { TicketStatus } from '@prisma/client'

export interface CreateTicketData {
  userId: string
  recentTaskId?: string
  message: string
  screenshotUrls?: string[]
  email?: string
}

export const ticketsRepo = {
  async create(data: CreateTicketData): Promise<{ ticketId: string }> {
    const ticketId = `F-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    const ticket = await db.feedbackTicket.create({
      data: {
        id: ticketId,
        ...data
      }
    })

    return { ticketId: ticket.id }
  },

  async listByUser(userId: string, limit: number = 50) {
    return await db.feedbackTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },

  async updateStatus(ticketId: string, status: TicketStatus) {
    return await db.feedbackTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() }
    })
  }
}