/**
 * 专门的数据库连接测试
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db/client'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log(`🔍 [DB Test] Starting database connection test`)

    // 测试1: 基本连接
    const connStart = Date.now()
    await db.$connect()
    const connTime = Date.now() - connStart
    console.log(`🔌 [DB Test] Database connection time: ${connTime}ms`)

    // 测试2: 简单查询
    const query1Start = Date.now()
    const result1 = await db.$queryRaw`SELECT 1 as test, NOW() as current_time`
    const query1Time = Date.now() - query1Start
    console.log(`🗄️  [DB Test] Simple raw query time: ${query1Time}ms`)

    // 测试3: Prisma查询
    const query2Start = Date.now()
    const userCount = await db.user.count()
    const query2Time = Date.now() - query2Start
    console.log(`👥 [DB Test] User count query time: ${query2Time}ms`)

    // 测试4: 复杂查询（模拟实际使用）
    const query3Start = Date.now()
    const recentTasks = await db.task.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        plan: true,
        createdAt: true,
        _count: {
          select: { photos: true }
        }
      }
    })
    const query3Time = Date.now() - query3Start
    console.log(`📋 [DB Test] Complex task query time: ${query3Time}ms`)

    // 测试5: 照片查询
    const query4Start = Date.now()
    const photoCount = await db.photo.count()
    const query4Time = Date.now() - query4Start
    console.log(`📸 [DB Test] Photo count query time: ${query4Time}ms`)

    const totalTime = Date.now() - startTime
    console.log(`⏱️  [DB Test] Total test time: ${totalTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Database test completed',
        results: {
          testConnection: result1,
          userCount,
          recentTasksCount: recentTasks.length,
          photoCount
        },
        timings: {
          connection: connTime,
          rawQuery: query1Time,
          userQuery: query2Time,
          taskQuery: query3Time,
          photoQuery: query4Time,
          total: totalTime
        }
      }
    })

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ [DB Test] Error after ${totalTime}ms:`, error)

    return NextResponse.json(
      {
        success: false,
        error: 'Database test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timing: totalTime
      },
      { status: 500 }
    )
  } finally {
    // 不要关闭连接，让它保持连接池状态
    // await db.$disconnect()
  }
}