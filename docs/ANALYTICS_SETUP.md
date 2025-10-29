# 🚀 埋点系统部署指南

## ✅ 已完成的工作

### 1. 数据库设计
- ✅ 添加 `user_events` 表 - 存储所有用户事件
- ✅ 添加 `user_sessions` 表 - 存储用户会话信息
- ✅ 更新 Prisma Schema

### 2. 核心代码
- ✅ `src/lib/analytics.ts` - 前端 SDK
- ✅ `src/app/api/analytics/track/route.ts` - 后端接口

### 3. 文档
- ✅ `docs/ANALYTICS_USAGE.md` - 使用指南

---

## 📋 部署步骤

### 步骤 1: 运行数据库迁移

```bash
cd d:\aiweb\project\rizzify

# 创建迁移
npx prisma migrate dev --name add_analytics_tables

# 生成 Prisma Client
npx prisma generate
```

### 步骤 2: 验证数据库

```bash
# 检查表是否创建成功
npx prisma studio
```

应该能看到两张新表：
- `user_events`
- `user_sessions`

### 步骤 3: 测试埋点功能

创建测试文件 `test-analytics.ts`：

```typescript
import { analytics, AnalyticsEvents } from '@/src/lib/analytics'

// 测试页面浏览
analytics.pageView('/')

// 测试事件追踪
analytics.track(AnalyticsEvents.PLAN_SELECT, {
  plan: 'starter',
  price: 9.99
})

console.log('Analytics test completed')
```

### 步骤 4: 在关键页面添加埋点

#### 4.1 首页 (`app/page.tsx`)
```typescript
'use client'
import { useEffect } from 'react'
import { analytics } from '@/src/lib/analytics'

export default function HomePage() {
  useEffect(() => {
    analytics.pageView('/')
  }, [])
  
  // ... 其他代码
}
```

#### 4.2 上传页面 (`app/(flow)/start/page.tsx`)
```typescript
'use client'
import { analytics, AnalyticsEvents } from '@/src/lib/analytics'

// 在性别选择时
const handleGenderSelect = (gender: string) => {
  analytics.track(AnalyticsEvents.GENDER_SELECT, { gender })
  // ... 原有逻辑
}

// 在上传开始时
const handleUploadStart = () => {
  analytics.track(AnalyticsEvents.UPLOAD_START)
  // ... 原有逻辑
}

// 在上传成功时
const handleUploadSuccess = (fileId: string) => {
  analytics.track(AnalyticsEvents.UPLOAD_SUCCESS, { fileId })
  // ... 原有逻辑
}
```

#### 4.3 套餐选择页 (`app/(flow)/gen-image/page.tsx`)
```typescript
const handlePlanSelect = (plan: string) => {
  analytics.track(AnalyticsEvents.PLAN_SELECT, { plan })
  // ... 原有逻辑
}
```

#### 4.4 结果页 (`app/(flow)/results/page.tsx`)
```typescript
useEffect(() => {
  analytics.track(AnalyticsEvents.RESULTS_VIEW, {
    taskId: task.id,
    photoCount: photos.length
  })
}, [])
```

---

## 🔍 验证埋点是否工作

### 方法 1: 查看数据库

```sql
-- 查看最近的事件
SELECT * FROM user_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看会话统计
SELECT 
  session_id,
  first_page,
  last_page,
  total_events,
  started_at
FROM user_sessions
ORDER BY started_at DESC
LIMIT 10;
```

### 方法 2: 查看浏览器控制台

打开浏览器开发者工具 → Network 标签，筛选 `/api/analytics/track`，应该能看到请求。

### 方法 3: 查看服务器日志

如果有错误，会在服务器控制台输出（但不会影响用户）。

---

## 📊 数据分析示例

### 转化漏斗

```sql
-- 查看完整转化路径
SELECT 
  event_type,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events
FROM user_events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total_events DESC;
```

### 用户旅程

```sql
-- 查看单个会话的完整事件流
SELECT 
  event_type,
  page_path,
  event_data,
  created_at
FROM user_events
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY created_at ASC;
```

---

## ⚠️ 重要提示

### 1. 不影响现有功能
- ✅ 所有埋点都是异步的
- ✅ 失败不会抛出错误
- ✅ 不阻塞用户操作

### 2. 性能优化
- ✅ 使用 `keepalive` 确保数据发送
- ✅ 数据库操作异步执行
- ✅ 即使数据库失败也返回成功

### 3. 隐私合规
- ✅ 不存储敏感信息
- ✅ IP 地址可选
- ✅ 支持禁用追踪

---

## 🛠️ 故障排查

### 问题 1: TypeScript 报错 `Property 'userEvent' does not exist`

**解决方案：**
```bash
npx prisma generate
```

### 问题 2: 数据库迁移失败

**解决方案：**
```bash
# 重置数据库（开发环境）
npx prisma migrate reset

# 重新迁移
npx prisma migrate dev --name add_analytics_tables
```

### 问题 3: 埋点不工作

**检查清单：**
1. ✅ 数据库迁移是否成功？
2. ✅ Prisma Client 是否重新生成？
3. ✅ API 路由是否正确？
4. ✅ 浏览器控制台是否有错误？

---

## 📈 下一步

1. **添加更多埋点**：根据需要在其他页面添加
2. **创建仪表板**：可视化展示数据
3. **设置告警**：关键指标异常时通知
4. **数据导出**：定期导出数据进行深度分析

---

## 📞 需要帮助？

查看详细使用指南：`docs/ANALYTICS_USAGE.md`
