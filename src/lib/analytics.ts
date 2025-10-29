/**
 * 轻量级埋点 SDK
 * 用于追踪用户行为，不影响现有业务逻辑
 */

type EventData = Record<string, any>

class Analytics {
  private sessionId: string
  private userId?: string
  private enabled: boolean = true

  constructor() {
    // 只在浏览器环境中初始化
    if (typeof window === 'undefined') {
      this.sessionId = ''
      this.enabled = false
      return
    }

    this.sessionId = this.getOrCreateSessionId()
  }

  /**
   * 获取或创建会话 ID
   */
  private getOrCreateSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('analytics_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('analytics_session_id', sessionId)
      }
      return sessionId
    } catch (error) {
      // 如果 sessionStorage 不可用，使用临时 ID
      return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * 设置用户 ID（登录后调用）
   */
  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * 清除用户 ID（登出时调用）
   */
  clearUserId() {
    this.userId = undefined
  }

  /**
   * 追踪事件
   * @param eventType 事件类型
   * @param eventData 事件数据（可选）
   */
  async track(eventType: string, eventData?: EventData) {
    // 如果未启用或在服务端，直接返回
    if (!this.enabled || typeof window === 'undefined') {
      return
    }

    try {
      // 异步发送，不阻塞用户操作
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          eventType,
          eventData: eventData || {},
          pagePath: window.location.pathname,
          referrer: document.referrer || undefined,
          userAgent: navigator.userAgent,
        }),
        // 使用 keepalive 确保在页面卸载时也能发送
        keepalive: true,
      }).catch((error) => {
        // 静默失败，不影响用户体验
        console.debug('Analytics tracking failed:', error)
      })
    } catch (error) {
      // 捕获所有错误，确保不影响业务逻辑
      console.debug('Analytics error:', error)
    }
  }

  /**
   * 页面浏览事件
   */
  pageView(pagePath?: string) {
    this.track('page_view', {
      path: pagePath || (typeof window !== 'undefined' ? window.location.pathname : ''),
    })
  }

  /**
   * 禁用追踪（用于隐私合规）
   */
  disable() {
    this.enabled = false
  }

  /**
   * 启用追踪
   */
  enable() {
    this.enabled = true
  }
}

// 导出单例
export const analytics = new Analytics()

// 导出事件类型常量（方便使用）
export const AnalyticsEvents = {
  // 页面浏览
  PAGE_VIEW: 'page_view',
  
  // 登录流程
  LOGIN_START: 'login_start',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_ERROR: 'login_error',
  LOGOUT: 'logout',
  
  // 上传流程
  GENDER_SELECT: 'gender_select',
  UPLOAD_START: 'upload_start',
  UPLOAD_SUCCESS: 'upload_success',
  UPLOAD_ERROR: 'upload_error',
  
  // 套餐选择
  PLAN_SELECT: 'plan_select',
  PAYMENT_CLICK: 'payment_click',
  
  // 支付流程
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  
  // 生成流程
  GENERATION_START: 'generation_start',
  GENERATION_COMPLETE: 'generation_complete',
  GENERATION_ERROR: 'generation_error',
  
  // 结果页
  RESULTS_VIEW: 'results_view',
  PHOTO_DOWNLOAD: 'photo_download',
  LOAD_MORE: 'load_more',
} as const
