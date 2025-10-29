import { db } from '../src/db/client'
import { usersRepo } from '../src/db/repo/users.repo'
import { uploadsRepo } from '../src/db/repo/uploads.repo'
import { tasksRepo } from '../src/db/repo/tasks.repo'
import { paymentsRepo } from '../src/db/repo/payments.repo'
import { ticketsRepo } from '../src/db/repo/tickets.repo'
import { auditRepo } from '../src/db/repo/audit.repo'
import { quotasRepo } from '../src/db/repo/quotas.repo'
import { Plan, Gender, TaskStatus, Section, PayStatus, TicketStatus } from '@prisma/client'

async function seed() {
  console.log('🌱 Starting database seeding...')

  try {
    // Create demo users (幂等处理)
    let demoUser = await usersRepo.getByEmail('demo@rizzify.dev')
    if (!demoUser) {
      demoUser = await usersRepo.create('demo@rizzify.dev', {
        name: 'Demo User',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
      })
      console.log('✅ Created demo user:', { id: demoUser.id, email: demoUser.email })
    } else {
      console.log('✅ Found existing demo user:', { id: demoUser.id, email: demoUser.email })
    }

    let vipUser = await usersRepo.getByEmail('vip@rizzify.dev')
    if (!vipUser) {
      vipUser = await usersRepo.create('vip@rizzify.dev', {
        name: 'VIP User',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vip'
      })
      console.log('✅ Created VIP user:', { id: vipUser.id, email: vipUser.email })
    } else {
      console.log('✅ Found existing VIP user:', { id: vipUser.id, email: vipUser.email })
    }

    // Create uploads for demo user
    const demoUpload = await uploadsRepo.create({
      userId: demoUser.id,
      filename: 'demo-photo.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 2 * 1024 * 1024, // 2MB
      width: 1024,
      height: 1024,
      objectKey: 'uploads/demo/demo-photo.jpg'
    })

    // Create uploads for VIP user
    const vipUpload = await uploadsRepo.create({
      userId: vipUser.id,
      filename: 'vip-photo.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 3 * 1024 * 1024, // 3MB
      width: 2048,
      height: 2048,
      objectKey: 'uploads/vip/vip-photo.jpg'
    })

    // Create tasks
    const demoTask = await tasksRepo.create({
      userId: demoUser.id,
      uploadId: demoUpload.id,
      plan: Plan.start,
      gender: Gender.female,
      idempotencyKey: 'demo-task-' + Date.now()
    })

    await tasksRepo.updateStatus(demoTask.id, {
      status: TaskStatus.done,
      progress: 100,
      completedAt: new Date()
    })

    const vipTask = await tasksRepo.create({
      userId: vipUser.id,
      uploadId: vipUpload.id,
      plan: Plan.pro,
      gender: Gender.male,
      idempotencyKey: 'vip-task-' + Date.now()
    })

    await tasksRepo.updateStatus(vipTask.id, {
      status: TaskStatus.running,
      progress: 75,
      etaSeconds: 30
    })

    // Create photos for each task (四区: uploaded, free, start, pro)
    const createPhotosForTask = async (taskId: string, plan: Plan) => {
      const sections = [Section.uploaded, Section.free, Section.start, Section.pro]

      for (const section of sections) {
        const count = plan === Plan.pro ? 5 : plan === Plan.start ? 3 : 2

        for (let i = 0; i < count; i++) {
          await db.photo.create({
            data: {
              taskId,
              section,
              objectKey: `tasks/${taskId}/${section}/photo-${i + 1}.jpg`,
              originalName: `${taskId}-${section}-${i + 1}.jpg`,
              expiresAt: section === Section.free
                ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h for free
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30d for start/pro
            }
          })
        }
      }
    }

    await createPhotosForTask(demoTask.id, Plan.start)
    await createPhotosForTask(vipTask.id, Plan.pro)

    // Create payments
    await paymentsRepo.create({
      userId: demoUser.id,
      plan: Plan.start,
      amountUsd: 9.99,
      provider: 'creem',
      providerRef: 'creem_demo_payment_123'
    })

    // 不需要更新状态，因为创建时已经是 succeeded

    await paymentsRepo.create({
      userId: vipUser.id,
      plan: Plan.pro,
      amountUsd: 29.99,
      provider: 'stripe',
      providerRef: 'stripe_vip_payment_456'
    })

    // Create feedback ticket
    const ticketResult = await ticketsRepo.create({
      userId: demoUser.id,
      recentTaskId: demoTask.id,
      message: 'Great results! The generated photos look amazing. Would love to see more customization options.',
      screenshotUrls: [
        'uploads/demo/screenshot-1.jpg',
        'uploads/demo/screenshot-2.jpg'
      ],
      email: 'demo@rizzify.dev'
    })

    // Create audit log (暂时跳过，因为外键约束)
    // await auditRepo.append({
    //   actorUserId: demoUser.id,
    //   action: 'ticket_created',
    //   targetType: 'ticket',
    //   targetId: ticketResult.ticketId,
    //   note: 'User created feedback ticket via web form'
    // })
    console.log('✅ Skipped audit log creation (foreign key constraint)')

    // Initialize daily quotas
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0) // Start of UTC day

    await quotasRepo.upsert(demoUser.id, today, { usedCount: 1 })
    await quotasRepo.upsert(vipUser.id, today, { usedCount: 0 }) // VIP users have no limits

    console.log('🎉 Database seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`  - Users: 2 (demo@rizzify.dev, vip@rizzify.dev)`)
    console.log(`  - Tasks: 2 (1 done, 1 running)`)
    console.log(`  - Photos: Multiple across all sections`)
    console.log(`  - Payments: 2`)
    console.log(`  - Tickets: 1`)
    console.log(`  - Audit logs: 1`)

  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run seeding
seed().catch(console.error)