/**
 * 模板图片索引
 * Mock Worker使用的模板图片元数据
 */

export const TEMPLATE_INDEX = {
  male: {
    classic: [
      '001.jpg',
      '002.jpg',
      '003.jpg',
      '004.jpg',
      '005.jpg'
    ]
  },
  female: {
    classic: [
      '001.jpg',
      '002.jpg',
      '003.jpg',
      '004.jpg',
      '005.jpg'
    ]
  }
} as const

export type GenderKey = keyof typeof TEMPLATE_INDEX
export type StyleKey = keyof typeof TEMPLATE_INDEX[GenderKey]

/**
 * 根据Plan获取生成数量
 */
export const PLAN_QUANTITIES = {
  free: 2,      // 2张，24小时过期
  start: 10,    // 8-12张
  pro: 20       // 18-24张
} as const

export type PlanKey = keyof typeof PLAN_QUANTITIES

/**
 * 生成策略配置
 */
export const GENERATION_CONFIG = {
  // 模拟Worker进度时间线（秒）
  progressTimeline: [
    { progress: 10, eta: 900 },   // 15分钟
    { progress: 45, eta: 600 },   // 10分钟
    { progress: 75, eta: 300 },   // 5分钟
    { progress: 100, eta: 0 }     // 完成
  ],

  // 过期时间
  expiration: {
    free: 24 * 60 * 60 * 1000,     // 24小时（毫秒）
    start: 30 * 24 * 60 * 60 * 1000, // 30天
    pro: 30 * 24 * 60 * 60 * 1000   // 30天
  }
} as const

/**
 * 获取模板图片路径
 */
export function getTemplatePath(gender: GenderKey, style: StyleKey, filename: string): string {
  return `templates/${gender}/${style}/${filename}`
}

/**
 * 获取结果图片路径
 */
export function getResultPath(taskId: string, section: 'free' | 'start' | 'pro', filename: string): string {
  return `results/${taskId}/${section}/${filename}`
}

/**
 * 随机选择模板图片
 */
export function selectRandomTemplates(
  gender: GenderKey,
  style: StyleKey,
  count: number
): string[] {
  const templates = TEMPLATE_INDEX[gender][style]
  const shuffled = [...templates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, templates.length))
}