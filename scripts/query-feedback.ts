import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

async function main() {
  const ticket = await prisma.feedbackTicket.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      message: true,
      email: true,
      screenshotUrls: true,
      recentTaskId: true,
      createdAt: true,
      status: true,
      user: { select: { id: true, email: true, name: true } },
    },
  })

  console.log('\nLatest FeedbackTicket:')
  if (ticket) {
    console.log(`ID: ${ticket.id}`)
    console.log(`User: ${ticket.user.name} (${ticket.user.email})`)
    console.log(`Message: ${ticket.message}`)
    console.log(`Email: ${ticket.email}`)
    console.log(`RecentTaskId: ${ticket.recentTaskId}`)
    console.log(`Created: ${ticket.createdAt}`)
    console.log(`Screenshots: ${ticket.screenshotUrls?.length || 0} files`)
    if (ticket.screenshotUrls && ticket.screenshotUrls.length > 0) {
      ticket.screenshotUrls.forEach((url, idx) => {
        console.log(`  [${idx + 1}] ${url}`)
      })
    }
  } else {
    console.log('No tickets found')
  }
}

main()
  .catch((err) => {
    console.error('Query failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
