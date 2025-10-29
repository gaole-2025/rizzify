# 📊 埋点使用指南

## 快速开始

### 1. 运行数据库迁移

```bash
npx prisma migrate dev --name add_analytics_tables
npx prisma generate
```

### 2. 在页面中使用

```typescript
'use client'

import { useEffect } from 'react'
import { analytics, AnalyticsEvents } from '@/src/lib/analytics'

export default function MyPage() {
  useEffect(() => {
    // 页面浏览
    analytics.pageView()
  }, [])

  const handleButtonClick = () => {
    // 追踪按钮点击
    analytics.track(AnalyticsEvents.PLAN_SELECT, {
      plan: 'starter',
      price: 9.99
    })
    
    // 继续业务逻辑...
  }

  return <div>...</div>
}
```

### 3. 设置用户 ID（登录后）

```typescript
import { analytics } from '@/src/lib/analytics'

// 登录成功后
analytics.setUserId(user.id)

// 登出时
analytics.clearUserId()
```

## 事件类型

### 页面浏览
```typescript
analytics.pageView()
```

### 上传流程
```typescript
// 选择性别
analytics.track(AnalyticsEvents.GENDER_SELECT, { gender: 'male' })

// 开始上传
analytics.track(AnalyticsEvents.UPLOAD_START, { fileSize: 1024000 })

// 上传成功
analytics.track(AnalyticsEvents.UPLOAD_SUCCESS, { fileId: 'xxx' })

// 上传失败
analytics.track(AnalyticsEvents.UPLOAD_ERROR, { 
  errorCode: 'FILE_TOO_LARGE',
  errorMessage: 'File exceeds 20MB limit'
})
```

### 套餐选择
```typescript
analytics.track(AnalyticsEvents.PLAN_SELECT, { 
  plan: 'starter',
  price: 9.99 
})

analytics.track(AnalyticsEvents.PAYMENT_CLICK, { 
  plan: 'pro',
  price: 19.99 
})
```

### 支付流程
```typescript
analytics.track(AnalyticsEvents.PAYMENT_SUCCESS, { 
  plan: 'starter',
  price: 9.99,
  orderId: 'order_xxx'
})

analytics.track(AnalyticsEvents.PAYMENT_FAILED, { 
  plan: 'starter',
  errorCode: 'CARD_DECLINED'
})
```

### 生成流程
```typescript
analytics.track(AnalyticsEvents.GENERATION_START, { 
  taskId: 'task_xxx',
  plan: 'starter'
})

analytics.track(AnalyticsEvents.GENERATION_COMPLETE, { 
  taskId: 'task_xxx',
  photoCount: 20,
  duration: 600 // 秒
})

analytics.track(AnalyticsEvents.GENERATION_ERROR, { 
  taskId: 'task_xxx',
  errorCode: 'GENERATION_FAILED'
})
```

### 结果页
```typescript
analytics.track(AnalyticsEvents.RESULTS_VIEW, { 
  taskId: 'task_xxx',
  photoCount: 20
})

analytics.track(AnalyticsEvents.PHOTO_DOWNLOAD, { 
  photoId: 'photo_xxx',
  section: 'start'
})

analytics.track(AnalyticsEvents.LOAD_MORE, { 
  section: 'start',
  page: 2
})
```

## 数据查询

### 转化漏斗

```sql
-- 最近 7 天的转化漏斗
WITH funnel AS (
  SELECT 
    COUNT(DISTINCT CASE WHEN event_type = 'page_view' AND page_path = '/' THEN session_id END) as homepage_visits,
    COUNT(DISTINCT CASE WHEN event_type = 'upload_start' THEN session_id END) as upload_starts,
    COUNT(DISTINCT CASE WHEN event_type = 'upload_success' THEN session_id END) as upload_success,
    COUNT(DISTINCT CASE WHEN event_type = 'plan_select' THEN session_id END) as plan_selects,
    COUNT(DISTINCT CASE WHEN event_type = 'payment_success' THEN session_id END) as payments,
    COUNT(DISTINCT CASE WHEN event_type = 'generation_complete' THEN session_id END) as completions
  FROM user_events
  WHERE created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  homepage_visits,
  upload_starts,
  ROUND(upload_starts::numeric / NULLIF(homepage_visits, 0) * 100, 2) as upload_rate,
  upload_success,
  ROUND(upload_success::numeric / NULLIF(upload_starts, 0) * 100, 2) as upload_success_rate,
  payments,
  ROUND(payments::numeric / NULLIF(upload_success, 0) * 100, 2) as payment_rate,
  completions,
  ROUND(completions::numeric / NULLIF(payments, 0) * 100, 2) as completion_rate
FROM funnel;
```

### 每日活跃用户

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as daily_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as daily_users
FROM user_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 最热门页面

```sql
SELECT 
  page_path,
  COUNT(*) as views,
  COUNT(DISTINCT session_id) as unique_visitors
FROM user_events
WHERE event_type = 'page_view'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_path
ORDER BY views DESC
LIMIT 10;
```

### 设备分布

```sql
SELECT 
  device_type,
  COUNT(DISTINCT session_id) as sessions,
  ROUND(COUNT(DISTINCT session_id)::numeric / SUM(COUNT(DISTINCT session_id)) OVER () * 100, 2) as percentage
FROM user_sessions
WHERE started_at >= NOW() - INTERVAL '7 days'
GROUP BY device_type
ORDER BY sessions DESC;
```

## 注意事项

1. **不影响业务逻辑**：所有埋点都是异步的，失败不会影响用户操作
2. **隐私保护**：不收集敏感信息，IP 地址可选择性存储
3. **性能优化**：使用 `keepalive` 确保页面卸载时也能发送数据
4. **错误容错**：所有错误都被捕获，静默失败

## 数据保留策略

- **原始事件数据**：建议保留 90 天
- **聚合统计数据**：可永久保留
- **清理脚本**：定期运行以节省存储空间

```sql
-- 删除 90 天前的事件
DELETE FROM user_events 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 删除 90 天前的会话
DELETE FROM user_sessions 
WHERE started_at < NOW() - INTERVAL '90 days';
```
