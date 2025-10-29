# ✅ Free 套餐限制 - UI 优化完成

## 🎯 问题和解决方案

### 问题 1：错误提示不友好
**之前**：显示 "Too many generation attempts. Please wait 30 seconds before trying again."
**现在**：显示 "You've reached your daily limit for the free plan. Upgrade to Start or Pro plan to generate more photos."

### 问题 2：UI 没有引导
**之前**：用户被卡在错误界面，不知道该怎么办
**现在**：显示两个按钮：
- ✅ "View Results" - 跳转到结果页面查看历史生成的图片
- ✅ "Choose Other Plan" - 返回计划选择界面，选择其他套餐

### 问题 3：错误响应格式不对
**之前**：`{ error: '...', code: '...' }`
**现在**：`{ error: { code: '...', message: '...' } }`（符合 ErrorResponse schema）

---

## 📝 修改清单

### 1️⃣ 后端 API 修改
**文件**：`app/api/generation/start/route.ts`
- 修改错误响应格式
- 返回正确的 `error.code` 和 `error.message`

```typescript
// 之前（错误）
return NextResponse.json(
  {
    error: "You've reached your daily limit...",
    code: 'daily_quota_exceeded',
    retryAfter: tomorrow.toISOString()
  },
  { status: 429 }
);

// 之后（正确）
return NextResponse.json(
  {
    error: {
      code: 'daily_quota_exceeded',
      message: "You've reached your daily limit for the free plan. Upgrade to Start or Pro plan to generate more photos."
    }
  },
  { status: 429 }
);
```

### 2️⃣ 前端 ErrorBanner 组件改进
**文件**：`components/stage1/common.tsx`
- 添加 `errorCode` 参数
- 针对 `daily_quota_exceeded` 的特殊处理
- 显示两个按钮：View Results 和 Choose Other Plan
- 使用琥珀色（amber）而不是红色，表示友好的提示

```typescript
// 新增特殊处理
if (errorCode === 'daily_quota_exceeded') {
  return (
    <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-4 py-3">
      <p className="mb-3 text-sm text-amber-200">{message}</p>
      <div className="flex gap-2">
        <button onClick={() => router.push('/results')}>
          View Results
        </button>
        <button onClick={onRetry}>
          Choose Other Plan
        </button>
      </div>
    </div>
  )
}
```

### 3️⃣ 前端页面逻辑修改
**文件**：`app/(flow)/gen-image/page.tsx`
- 添加 `errorCode` 状态
- 在 `resetToPlans` 中清除 `errorCode`
- 在错误处理中设置 `errorCode`
- 传递 `errorCode` 给 `ErrorBanner`

```typescript
// 添加状态
const [errorCode, setErrorCode] = useState<string | null>(null);

// 在错误处理中
setErrorCode(err.code || null);

// 传递给 ErrorBanner
<ErrorBanner 
  message={errorMessage ?? ""} 
  onRetry={resetToPlans} 
  errorCode={errorCode ?? undefined} 
/>
```

---

## 🎨 UI 效果

### 配额超限时的提示
```
┌─────────────────────────────────────────────────────────┐
│ 🟡 You've reached your daily limit for the free plan.   │
│    Upgrade to Start or Pro plan to generate more        │
│    photos.                                              │
│                                                         │
│ [View Results]  [Choose Other Plan]                    │
└─────────────────────────────────────────────────────────┘
```

### 按钮行为
- **View Results** → 跳转到 `/results` 页面
- **Choose Other Plan** → 返回计划选择界面（调用 `resetToPlans`）

---

## ✅ 验证步骤

1. **测试配额超限**
   - 用 free 计划生成一次
   - 再次尝试生成 free 计划
   - 应该看到新的友好提示和两个按钮

2. **测试 View Results 按钮**
   - 点击 "View Results" 按钮
   - 应该跳转到 `/results` 页面

3. **测试 Choose Other Plan 按钮**
   - 点击 "Choose Other Plan" 按钮
   - 应该返回计划选择界面
   - 可以选择其他套餐（start 或 pro）

---

## 📊 修改统计

| 文件 | 修改 | 行数 |
|------|------|------|
| `app/api/generation/start/route.ts` | 错误格式 | ~10 |
| `components/stage1/common.tsx` | ErrorBanner 增强 | ~30 |
| `app/(flow)/gen-image/page.tsx` | 错误处理逻辑 | ~10 |

**总计**：~50 行代码修改

---

## 🚀 现在可以测试了

所有修改已完成，可以立即测试：

1. 安装依赖：`npm install sharp`
2. 启动应用
3. 用 free 计划生成一次
4. 再次尝试生成，看到新的友好提示

完成！🎉

