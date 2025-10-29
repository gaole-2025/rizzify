import { db } from '../src/db/client'
import { usersRepo } from '../src/db/repo/users.repo'
import { uploadsRepo } from '../src/db/repo/uploads.repo'
import { tasksRepo } from '../src/db/repo/tasks.repo'
import { photosRepo } from '../src/db/repo/photos.repo'
import { Plan, Gender, TaskStatus, Section } from '@prisma/client'

async function smokeTest() {
  console.log('🔥 Starting DB smoke test...')

  try {
    // 1. Create or get user (幂等处理)
    let user = await usersRepo.getByEmail('smoke-test@example.com')
    if (!user) {
      user = await usersRepo.create('smoke-test@example.com', {
        name: 'Smoke Test User'
      })
      console.log('✅ Created user:', { id: user.id, email: user.email })
    } else {
      console.log('✅ Found existing user:', { id: user.id, email: user.email })
    }

    // 2. Create upload
    const upload = await uploadsRepo.create({
      userId: user.id,
      filename: 'test-image.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1024 * 1024, // 1MB
      width: 1024,
      height: 1024,
      objectKey: 'uploads/test-user/test-image.jpg'
    })
    console.log('✅ Created upload:', { id: upload.id, filename: upload.filename })

    // 3. Create task (queued)
    const task = await tasksRepo.create({
      userId: user.id,
      uploadId: upload.id,
      plan: Plan.free,
      gender: Gender.male,
      idempotencyKey: 'smoke-test-key-' + Date.now()
    })
    console.log('✅ Created task:', { id: task.id, status: task.status, plan: task.plan })

    // 4. Insert 1 free photo
    const photo = await db.photo.create({
      data: {
        taskId: task.id,
        section: Section.free,
        objectKey: `tasks/${task.id}/free/test-photo.jpg`,
        originalName: 'generated-photo.jpg'
      }
    })
    console.log('✅ Created photo:', { id: photo.id, section: photo.section })

    // 5. Test photo retrieval by sections
    const photosBySections = await photosRepo.listByTaskSections(task.id)
    console.log('✅ Retrieved photos by sections:', {
      free: photosBySections.free.length,
      uploaded: photosBySections.uploaded.length,
      start: photosBySections.start.length,
      pro: photosBySections.pro.length
    })

    console.log('🎉 Smoke test completed successfully!')
    console.log('📊 Summary:', {
      user: { id: user.id },
      upload: { id: upload.id },
      task: { id: task.id },
      photo: { id: photo.id }
    })

  } catch (error) {
    console.error('❌ Smoke test failed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the smoke test
smokeTest().catch(console.error)