import { db } from '../src/db/client'
import { usersRepo } from '../src/db/repo/users.repo'
import { quotasRepo } from '../src/db/repo/quotas.repo'

/**
 * Free 额度结转脚本
 * 以 UTC 02:00 为刷新基准
 * 初始化当日 DailyQuota（如果不存在则插入 usedCount=0）
 */
async function quotasRollover() {
  console.log('🔄 Starting daily quota rollover...')
  console.log('🕐 UTC 02:00 refresh基准 - Current time:', new Date().toISOString())

  try {
    // 获取当前 UTC 日期
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0) // 设置为 UTC 当天开始时间

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1) // 昨天

    console.log(`📅 Processing quota rollover for ${today.toISOString().split('T')[0]}`)

    // 获取所有用户
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    console.log(`👥 Found ${allUsers.length} users to process`)

    let initializedCount = 0
    let alreadyExistsCount = 0

    // 为每个用户处理当日额度
    for (const user of allUsers) {
      const existingQuota = await quotasRepo.getForDay(user.id, today)

      if (!existingQuota) {
        // 初始化当日额度为 0
        await quotasRepo.upsert(user.id, today, { usedCount: 0 })
        initializedCount++
        console.log(`✅ Initialized daily quota for user: ${user.email} (${user.name || 'N/A'})`)

        // 记录前一天的额度使用情况（如果存在）
        const yesterdayQuota = await quotasRepo.getForDay(user.id, yesterday)
        if (yesterdayQuota) {
          console.log(`📊 Yesterday's usage for ${user.email}: ${yesterdayQuota.usedCount} photos`)
        }
      } else {
        alreadyExistsCount++
        console.log(`⏭️  Daily quota already exists for user: ${user.email} (${existingQuota.usedCount} used)`)
      }
    }

    // 统计当日总体额度使用情况
    const todayQuotas = await db.dailyQuota.findMany({
      where: {
        dayUtc: today
      }
    })

    const totalUsedToday = todayQuotas.reduce((sum, quota) => sum + quota.usedCount, 0)
    const activeUsersToday = todayQuotas.filter(quota => quota.usedCount > 0).length

    // 统计昨日情况用于对比
    const yesterdayQuotas = await db.dailyQuota.findMany({
      where: {
        dayUtc: yesterday
      }
    })

    const totalUsedYesterday = yesterdayQuotas.reduce((sum, quota) => sum + quota.usedCount, 0)
    const activeUsersYesterday = yesterdayQuotas.filter(quota => quota.usedCount > 0).length

    console.log('📊 Daily quota statistics:')
    console.log(`  - Date (UTC): ${today.toISOString().split('T')[0]}`)
    console.log(`  - Total users: ${allUsers.length}`)
    console.log(`  - Users with initialized quota: ${initializedCount}`)
    console.log(`  - Users with existing quota: ${alreadyExistsCount}`)
    console.log(`  - Active users today: ${activeUsersToday}`)
    console.log(`  - Total photos used today: ${totalUsedToday}`)
    console.log(`  - Active users yesterday: ${activeUsersYesterday}`)
    console.log(`  - Total photos used yesterday: ${totalUsedYesterday}`)

    // 检查是否有用户的免费额度接近上限
    const usersNearLimit = todayQuotas.filter(quota => quota.usedCount >= 1) // 假设免费额度是2张/天
    if (usersNearLimit.length > 0) {
      console.log('⚠️  Users near daily limit:')
      usersNearLimit.forEach(async (quota) => {
        const user = await usersRepo.getByEmail(quota.userId) // 这里应该是userId，需要修复
        console.log(`  - User ${quota.userId}: ${quota.usedCount} photos used`)
      })
    }

    console.log('✅ Daily quota rollover completed successfully!')
    console.log('💡 Tip: This script should be scheduled to run daily after UTC 02:00')

  } catch (error) {
    console.error('❌ Daily quota rollover failed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the rollover
quotasRollover().catch(console.error)