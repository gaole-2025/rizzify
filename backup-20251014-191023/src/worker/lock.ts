// src/worker/lock.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const LOCK_KEY = 748392 // 随便的常数，项目固定即可

export async function tryAcquireDbLock(): Promise<boolean> {
  const res = await prisma.$queryRawUnsafe<{ pg_try_advisory_lock: boolean }[]>(
    `SELECT pg_try_advisory_lock(${LOCK_KEY}) as locked;`
  )
  return !!res?.[0]?.locked
}

export async function releaseDbLock() {
  await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(${LOCK_KEY});`)
}