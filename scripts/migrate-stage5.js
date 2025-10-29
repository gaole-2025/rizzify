const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('Running Stage 5 migrations...');

    // Add style column to Task table if not exists
    await prisma.$executeRaw`
      ALTER TABLE "public"."Task"
      ADD COLUMN IF NOT EXISTS "style" TEXT DEFAULT 'classic';
    `;

    // Update existing records to have default style
    await prisma.$executeRaw`
      UPDATE "public"."Task"
      SET "style" = 'classic'
      WHERE "style" IS NULL;
    `;

    // Update existing records to have default progress
    await prisma.$executeRaw`
      UPDATE "public"."Task"
      SET "progress" = 0
      WHERE "progress" IS NULL;
    `;

    // Add metadata columns to Photo table if not exists
    await prisma.$executeRaw`
      ALTER TABLE "public"."Photo"
      ADD COLUMN IF NOT EXISTS "width" INT,
      ADD COLUMN IF NOT EXISTS "height" INT,
      ADD COLUMN IF NOT EXISTS "mime" TEXT,
      ADD COLUMN IF NOT EXISTS "sizeBytes" BIGINT;
    `;

    console.log('✅ Stage 5 migrations completed successfully!');

    // Verify the changes
    const taskSample = await prisma.task.findFirst();
    console.log('Task sample (with style field):', {
      id: taskSample?.id,
      style: taskSample?.style,
      progress: taskSample?.progress,
      idempotencyKey: taskSample?.idempotencyKey
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();