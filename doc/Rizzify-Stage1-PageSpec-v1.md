# Rizzify — Stage 1 · PageSpec v1

> 只定义 **页面布局/交互/显示字段/假数据**；不写接口/数据库/像素级视觉。所有字段名将上升为 Stage2（OpenAPI/Zod）的响应子集。

## 0. 全局规范（适用于本阶段全部页面）

* **功能 Header（非首页）**：`[Logo→/]  Start  Generate  Results  Feedback  [Avatar Menu]`。不区分登录态显示结构；未登录点击受限项时再触发登录。
* **路由守卫**：

  * 未登录访问 `/start|/gen-image|/results|/feedback` → 重定向 `/login?redirect=目标`（但页面的 Header 一律渲染）。
  * `/feedback` 另有“资格守卫”：仅“生成过图片”的用户可访问，否则空态+去生成 CTA。
* **Loading/Empty/Error/Disabled**：每页必须描述。
* **响应式**：≥1280 三列；768–1279 两列；<768 一列；移动端 Drawer 全屏。
* **A11y**：可键盘操作，主 CTA 可 Enter 触发；对话框 `role=dialog`，焦点陷阱；所有图像有 `alt`。

---

## 1) Login `/login`

**目标**：提供**单一的 Google 登录**入口；页面为**单列卡片**样式，登录后落回 `redirect`（缺省 `/start`）。

### 1.1 盒线稿（Lo-fi）

```
Backdrop（轻微模糊的示例图）
┌────────────────── Pane · Sign in ──────────────────┐
│ Headline:  Sign in to transform your selfies       │
│ Subtext:   Upload one photo. Get results in 10–15m │
│                                                   │
│ [ Continue with Google ] (带 G 图标)                │
│                                                   │
│ Highlights (3条小字):                              │
│  • No password required                            │
│  • Free plan: 2 photos/day                         │
│  • Watermark removed on paid plans                 │
│                                                   │
│ Compliance note（极小字）:                          │
│  No nudity, impersonation, or minors.             │
│                                                   │
│ Footnote: By continuing you agree to Terms/Privacy │
└───────────────────────────────────────────────────┘
```

### 1.2 交互

* `[Continue with Google] → OAuth`

  * 成功：按内部 `redirect` 参数返回上一受限页（**UI 不展示跳转目标**）。
  * 失败：顶部 toast `Sign-in failed. Please try again.`
* 按钮四态：`default / loading("Signing in…") / error / disabled`
* A11y：按钮 `aria-label="Continue with Google"`；回车触发；焦点初始落在主按钮。

### 1.3 显示字段（Display Fields）

* `LoginProviders: { allowGoogle: true }`
* `Copy: { headline: string, subtext: string, highlights: string[], complianceNote: string }`
* `LegalLinks: { termsHref: string, privacyHref: string }`
* `Redirect: { to?: string, exposeInUI: false }`  // 仅内部使用，不在 UI 文案中呈现

### 1.4 假数据

```json
{
  "providers": { "allowGoogle": true },
  "copy": {
    "headline": "Sign in to transform your selfies into swipe rights",
    "subtext": "Upload one photo. Get magazine-grade portraits in 10–15 minutes.",
    "highlights": [
      "No password required",
      "Free plan: 2 photos/day",
      "Watermark removed on paid plans"
    ],
    "complianceNote": "No nudity, impersonation, or minors."
  },
  "legalLinks": { "termsHref": "/terms", "privacyHref": "/privacy" },
  "redirect": { "to": "/start", "exposeInUI": false }
}
```


---

好的！我按你给的参考图，把 **/start** 用我们 Stage-1 的格式重写了一版（仍坚持“只需 1 张照片”），一栏直下、包含“示例图片/避坑示例/小贴士/拖拽上传区/大按钮”。你直接把这一节替换进《Rizzify-Stage1-PageSpec-v1.md》的 **2) Start**。

---

## 2) Start `/start`

**目标**：选择性别 → 上传 **1 张**人像 → 点击 **Generate**；随后出现 **6s Preparing overlay** 再跳 `/gen-image`。
**说明**：版式参考提供的截图，采用单列卡片自上而下排列；示例区仅做静态展示。

### 2.1 盒线稿（Lo-fi）

```
Header（功能版）

Title: Transform your dating profile with realistic AI photos.
Subtext: Upload one photo. Get magazine-grade results in 10–15 minutes.

┌ Section • I am a ────────────────────────────────────────────────┐
│ [ Male ]  [ Female ]（二选一，未选时后续控件禁用）                    │
└──────────────────────────────────────────────────────────────────┘

┌ Section • Ideal Photo Examples / Photos to Avoid ────────────────┐
│ 上：Ideal（4 张小缩略图+简短标签：清晰光照 / 多表情 / 正面 / 无遮挡） │
│ 下：Avoid（4 张：被遮挡 / 多人 / 过度裁剪 / 太阳镜/口罩）             │
│ 注：仅展示示例，不会被上传                                          │
└──────────────────────────────────────────────────────────────────┘

┌ Section • Upload your photo ─────────────────────────────────────┐
│ Dropzone（接受 jpg/png；≤20MB；仅 1 张）                           │
│ 预览缩略图（可删除/重传）                                          │
│ 辅助文案：Supported formats: JPG, PNG.                            │
└──────────────────────────────────────────────────────────────────┘

Primary CTA（整宽按钮）:  [ Generate realistic AI images ]

Overlay • Preparing (6s)：中心 Spinner + “Preparing your personal model…”
```

### 2.2 交互（Interactions）

* **性别必选**：未选择 `gender` 时，“上传区”和 “Generate” 均为 **disabled**，并显示轻提示。
* **上传限制**：仅 1 张；`type ∈ {jpg,png}`；`size ≤ 20MB`；`minWidth/Height ≥ 768px`。

  * 违规文件：红框 + 错误条 `File must be JPG/PNG, ≥768px, ≤20MB, and show a single unobstructed face.`
* **预览/重传**：选择后展示缩略图；可“Remove”并重新选择。
* **主按钮**：满足（性别已选 + 文件合规）后可点击 → 触发 **6s Preparing overlay** → 跳转 `/gen-image`。
* **会话保持**：在本页刷新，保留 `gender` 与文件选择状态（文件需重新校验）。
* **A11y**：

  * `Male/Female` 为单选组（RadioGroup）；
  * Dropzone 支持键盘 `Enter/Space` 打开文件选择；
  * 错误文本通过 `aria-describedby` 关联输入控件。

### 2.3 显示字段（Display Fields）

* `GenderOption: { value: 'male'|'female', label: string }`
* `OnboardingCopy: { title: string, subtext: string }`
* `Examples: { ideal: {thumbUrl: string, caption: string}[], avoid: {thumbUrl: string, caption: string}[] }`
* `Tips: { bullets: string[] }`
* `Dropzone: { accept: string[], maxSizeMB: number, minResolution: number, maxFiles: 1 }`
* `SelectedFile: { name: string, sizeMB: number, width: number, height: number, previewUrl: string } | null`
* `PrimaryCTA: { label: string, disabled: boolean }`
* `Footnotes: { freePolicy: string, compliance: string }`
* `PreparingOverlay: { visible: boolean, message: string, subtext?: string, durationMs: number }`

### 2.4 假数据（Mock JSON）

```json
{
  "copy": {
    "title": "Transform your dating profile with realistic AI photos.",
    "subtext": "Upload one photo. Get magazine-grade results in 10–15 minutes."
  },
  "gender": "male",
  "examples": {
    "ideal": [
      { "thumbUrl": "/demo/ideal1.jpg", "caption": "Good lighting" },
      { "thumbUrl": "/demo/ideal2.jpg", "caption": "Varied expressions" },
      { "thumbUrl": "/demo/ideal3.jpg", "caption": "Direct, centered" },
      { "thumbUrl": "/demo/ideal4.jpg", "caption": "No obstructions" }
    ],
    "avoid": [
      { "thumbUrl": "/demo/avoid1.jpg", "caption": "Covered face" },
      { "thumbUrl": "/demo/avoid2.jpg", "caption": "Multiple persons" },
      { "thumbUrl": "/demo/avoid3.jpg", "caption": "Over-cropped" },
      { "thumbUrl": "/demo/avoid4.jpg", "caption": "Sunglasses or mask" }
    ]
  },
  "tips": {
    "bullets": [
      "Use a recent, well-lit portrait",
      "Face visible, no sunglasses or mask",
      "Single person, centered",
      "Min resolution ≥ 768px"
    ]
  },
  "dropzone": {
    "accept": ["image/jpeg", "image/png"],
    "maxSizeMB": 20,
    "minResolution": 768
  },
  "selected": {
    "name": "me.jpg",
    "sizeMB": 2.4,
    "width": 1200,
    "height": 1600,
    "previewUrl": "/demo/me-thumb.jpg"
  },
  "cta": { "label": "Generate realistic AI images", "disabled": false },
  "footnotes": {
    "freePolicy": "Free: 2 photos/day with watermark, auto-delete in 24h (UTC 02:00 reset).",
    "compliance": "No nudity, impersonation, or minors."
  },
  "preparing": {
    "visible": true,
    "message": "Preparing your personal model…",
    "subtext": "Keep this tab open. You'll pick a plan next.",
    "durationMs": 6000
  }
}
```

> 备注：示例区（Ideal/Avoid）只做静态展示，不参与上传；若未来允许“多图更优”，可在 Stage-2 再扩展 Dropzone 的 `maxFiles`，但当前版本保持 **仅 1 张**。


---

好的，我把 **/gen-image** 按你的新要求重写为“**两态单区块**”：

* 初始只显示 **Choose your plan**（三张套餐卡）；
* 选择 Free 或付费成功后，**用同一块区域替换为 Processing 面板**，居中一个圆形转圈动画 + 一行小字“10–15 分钟”。

直接替换你 Stage1 文档里的 **3) Gen-Image `/gen-image`** 小节即可。

---

## 3) Gen-Image `/gen-image`

**目标**：先只展示“Choose your plan”。Free 直接开始；Start/Pro 打开 Creem 支付 Sheet。**支付成功或选择 Free 后**，将“Choose your plan”区域替换为**Processing 面板**（圆圈转圈 + 一行提示），等待生成完成后自动跳转 `/results/:taskId`。
**注意**：本页**不再**展示底部的“Processing status 列表/卡片”。

### 3.1 盒线稿（Lo-fi）

```
Header（功能版）

┌──────────────────────────── Card · Choose your plan ───────────────────────────┐
│ Title: Choose your plan                                                         │
│ Sub:  Free starts immediately. Start/Pro opens the Creem payment sheet.        │
│                                                                                │
│ [ Free ]   [ Starter (HD) ]   [ Pro ]       ← 3张套餐卡，3列或响应式换为1/2列  │
│                                                                                │
│ (No other content below this card)                                             │
└────────────────────────────────────────────────────────────────────────────────┘

— 用户选择 Free 或付费成功后，**用下方面板替换上面整块卡片** —

┌──────────────────────────── Card · Processing ─────────────────────────────────┐
│ Title: Creating your AI photos                                                  │
│ [ Spinner · 圆圈持续旋转 ]                                                       │
│ small text: This usually takes 10–15 minutes. Please keep this tab open.       │
│ （无进度条、无任务列表）                                                         │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 交互（Interactions）

* **选择计划**

  * 点击 **Free** → `startGeneration('free')` → 进入 **Processing** 面板。
  * 点击 **Starter/Pro** → 打开 **Creem Payment Sheet**；支付成功 → `startGeneration(plan)` → 进入 **Processing** 面板；失败/取消 → 仍停留在“Choose your plan”卡片，可重试。
* **Processing 面板**

  * 仅显示**圆形转圈动画**与一句提示文案：`This usually takes 10–15 minutes…`
  * 后台轮询任务（每 3s）或接收推送；状态 `done` 时自动跳 `/results/:taskId`；`error` 时在**卡片顶部**显示 Error banner（Retry 按钮返回“Choose your plan”卡片）。
* **登录守卫**

  * 未登录点击任意 plan → `/login?redirect=/gen-image`。
* **无障碍**

  * PlanCard 可键盘选中（Enter/Space）；Payment Sheet 作为 `role="dialog"`，包含焦点陷阱；Processing 面板的 spinner 加 `aria-busy="true"` 与 `aria-live="polite"` 的提示文本。

### 3.3 显示字段（Display Fields）

* `PlanCard: { code: 'free'|'start'|'pro', title: string, price: number, quota: number, styles: number, features: string[], badge?: string }`
* `ChooseCopy: { title: string, subtext: string }`
* `PaymentSheet: { open: boolean, planCode?: 'start'|'pro', price?: number, planTitle?: string }`
* `ProcessingView: { visible: boolean, title: string, message: string }`

  > `message` 固定说明“10–15 分钟”；不显示进度条与任务列表。
* `QueuePoll: { taskId?: string, status: 'idle'|'queued'|'running'|'done'|'error' }`
* `ErrorBanner: { visible: boolean, message: string }`

### 3.4 假数据（Mock JSON）

**A. 初始（选择套餐）**

```json
{
  "chooseCopy": {
    "title": "Choose your plan",
    "subtext": "Free plan starts immediately. Starter/Pro open the Creem payment sheet."
  },
  "plans": [
    { "code": "free",  "title": "Free",          "price": 0,    "quota": 2,  "styles": 0,  "features": ["2 photos/day", "watermark", "24h access"] },
    { "code": "start", "title": "Starter (HD)",  "price": 9.99, "quota": 30, "styles": 15, "features": ["HD", "no watermark", "priority queue"], "badge": "Recommended" },
    { "code": "pro",   "title": "Pro",           "price": 19.99,"quota": 70, "styles": 35, "features": ["HD", "no watermark", "two reruns"] }
  ],
  "paymentSheet": { "open": false },
  "processingView": { "visible": false, "title": "", "message": "" },
  "queuePoll": { "status": "idle" },
  "error": { "visible": false, "message": "" }
}
```

**B. 开始生成（替换为 Processing 面板）**

```json
{
  "processingView": {
    "visible": true,
    "title": "Creating your AI photos",
    "message": "This usually takes 10–15 minutes. Please keep this tab open."
  },
  "queuePoll": { "taskId": "t123", "status": "running" },
  "error": { "visible": false, "message": "" }
}
```

**C. 出错（仍在 Processing 面板上方显示 banner）**

```json
{
  "processingView": {
    "visible": true,
    "title": "Creating your AI photos",
    "message": "This usually takes 10–15 minutes. Please keep this tab open."
  },
  "queuePoll": { "taskId": "t123", "status": "error" },
  "error": { "visible": true, "message": "Something went wrong. Please try again." }
}
```

### 3.5 Payment Sheet · 行为要点（保持不变）

* 状态机：`idle → paying → (3ds?) → success | fail | canceled`
* 成功：关闭 Sheet → 切换到 **Processing** 面板；失败/取消：停留在 Choose 卡片并显示错误（可重试）。
* 埋点：`payment_opened/attempted/3ds_required/failed/succeeded`。

### 3.6 DoD（本页通过标准）

* 初始只显示“Choose your plan”卡片，无任何“队列状态卡”。
* 支付成功 / 选择 Free 后，页面**同一区域**切换为“Processing 面板”（圆圈转圈 + 一行提示）。
* 轮询到 `done` 自动跳 `/results/:taskId`；`error` 有 banner 并可回到“Choose your plan”。
* 未登录守卫、A11y、加载/错误四态可演示；无任何 DevHarness 控件混入主体。

---

## 4)Results /results/:taskId（分区版）

目标：按来源分区展示：Uploaded、Free、Start、Pro。每区有自己的网格与批量操作；保留预览/下载/删除；Free 到期禁用下载。

4.1 盒线稿（Lo-fi）
Header（功能版）

Title：Results – Task #t123
Subtitle：Plan: Start · Created 2025/09/24 20:00 · Total 30

SectionNav（锚点跳转，显示数量）
[ Uploaded (1) ] [ Free (2) ] [ Start (27) ] [ Pro (0) ]

— Section • Uploaded ————————————————————————————————
Toolbar（右侧）：Download all  Delete all（若仅1张可省略）
Grid：OriginalCard × 1（大卡）
Empty：无

— Section • Free —————————————————————————————————
标签：Free（红） · 说明：Watermarked · Expires in 24h（若过期显示 Expired）
Toolbar：Download all  Delete all
Grid：ResultCard × N（到期卡片右上角显示“Expired”且按钮禁用）
Empty：No free previews in this task.

— Section • Start ————————————————————————————————
标签：Start（蓝）
Toolbar：Download all  Delete all
Grid：ResultCard × N
Empty：No photos in Start.

— Section • Pro ——————————————————————————————————
标签：Pro（紫）
Toolbar：Download all  Delete all
Grid：ResultCard × N
Empty：No photos in Pro.

Preview Drawer（右侧抽屉）：
大图；按钮：Download（命名规则） / Delete / Copy link（非 Free 过期）
Footer Notes（页面底部固定两行）：
· Free files auto-delete after 24h.  · Start/Pro kept 30 days.  · UTC 02:00 daily reset.

4.2 交互（Interactions）

分区锚点：点击 SectionNav 跳至对应分区；进入页面默认滚到第一个非空分区。

卡片：点击打开 Preview Drawer；左右键切换同分区内上一/下一张；Esc 关闭。

下载：预签名直链；命名 taskId_{section}_{index}_{yyyyMMddHHmm}.jpg，其中 section ∈ {uploaded, free, start, pro}。

删除：单张删除前确认；成功后从分区中移除，并立即失效直链。

批量操作（每区独立）：

Download all：打包该区全部文件为 zip；显示“打包中”进度条；完成后给 zip 直链。

Delete all：二次确认；成功后清空该区。

到期处理（Free）：

未到期：显示剩余时间徽标（如 23h 12m）；允许下载/复制。

已到期：卡片角标 Expired；下载/复制禁用；提示“Upgrade to save longer”.

错误/空态：分区级 Error banner 与 Retry；空分区显示简短提示。

A11y：每分区标题用 <h2>；Drawer 有焦点陷阱；按钮有 aria-label。

4.3 显示字段（Display Fields）

TaskInfo: { id: string, createdAt: iso8601, plan: 'free'|'start'|'pro', total: number }

SectionNav: { uploaded: number, free: number, start: number, pro: number }

OriginalCard: { id: uuid, url: string, createdAt: iso8601 }

ResultCard: { id: uuid, url: string, section: 'free'|'start'|'pro', createdAt: iso8601, expiresAt?: iso8601 }

SectionState: { key: 'uploaded'|'free'|'start'|'pro', error?: string, downloadingAll: boolean, deletingAll: boolean }

PreviewState: { open: boolean, section: 'uploaded'|'free'|'start'|'pro', index: number }

ErrorBanner: { visible: boolean, message: string, section: string }

Notes: { freePolicy: string, retention: string, reset: string }

4.4 假数据（Mock JSON）
{
  "task": { "id": "t123", "createdAt": "2025-09-24T12:00:00Z", "plan": "start", "total": 30 },
  "nav":   { "uploaded": 1, "free": 2, "start": 27, "pro": 0 },

  "uploaded": {
    "items": [
      { "id": "o1", "url": "/img/original.jpg", "createdAt": "2025-09-24T12:00:00Z" }
    ],
    "state": { "key": "uploaded", "downloadingAll": false, "deletingAll": false }
  },

  "free": {
    "items": [
      { "id": "f1", "url": "/img/f1.jpg", "section": "free", "createdAt": "2025-09-24T12:10:00Z", "expiresAt": "2025-09-25T12:10:00Z" },
      { "id": "f2", "url": "/img/f2.jpg", "section": "free", "createdAt": "2025-09-24T12:10:10Z", "expiresAt": "2025-09-25T12:10:10Z" }
    ],
    "state": { "key": "free", "downloadingAll": false, "deletingAll": false }
  },

  "start": {
    "items": [
      { "id": "s1", "url": "/img/s1.jpg", "section": "start", "createdAt": "2025-09-24T12:12:00Z" },
      { "id": "s2", "url": "/img/s2.jpg", "section": "start", "createdAt": "2025-09-24T12:12:10Z" }
    ],
    "state": { "key": "start", "downloadingAll": false, "deletingAll": false }
  },

  "pro": {
    "items": [],
    "state": { "key": "pro", "downloadingAll": false, "deletingAll": false }
  },

  "notes": {
    "freePolicy": "Free files expire in 24h with watermark.",
    "retention":  "Start/Pro keep 30 days. Delete removes public links immediately.",
    "reset":      "Daily reset at UTC 02:00."
  }
}

4.5 DoD（本页通过标准）

页面按 Uploaded / Free / Start / Pro 四个分区展示，不混放；无 New/Old、无搜索框。

每区支持 Download all / Delete all；单张支持 Preview / Download / Delete / Copy link。

Free 到期后卡片禁用下载与复制，并显示 Expired。

下载命名规则：taskId_section_index_timestamp.jpg。

分区导航可跳转；预览抽屉在同分区内左右切换。
---

好的，我把 **/feedback** 按你要的“极简收集问题 + 可选截图”重写成 Stage-1 规范，用来替换文档第 5 节。

---

## 5) Feedback `/feedback`（极简版）

**目标**：仅“有生成历史”的登录用户可访问；**只收集问题描述**（必填）+ **最多 3 张截图**（可选）。后台自动关联**最近一次任务**，无需用户选择类型/严重度/任务。

### 5.1 盒线稿（Lo-fi）

```
Header（功能版）

Eligibility Gate：
- 未登录 → /login
- 无生成历史 → 空态：You need at least one generation to send feedback. [Go generate]

Card · Submit feedback
  Helper text（小字）：We’ll link this to your most recent generation for faster support.

  Textarea • Your message (required, ≥ 10 chars)
  Upload area • Screenshots (0..3)  JPG/PNG ≤5MB each
     [ + ] [ + ] [ + ]   （选择后可移除/预览缩略图）

  Email (optional)  —  help us reach you if needed

  [ Submit ]  (disabled until message ≥10)

Success state（卡片内替换）：
  Thank you! Ticket #F-20250924-001
  [View results]  [Close]
Footer notes（细小字）：
  • One submission every 60s. • No nudity, impersonation, or minors.
```

### 5.2 交互（Interactions）

* **资格守卫**：仅“有生成历史”的登录用户可访问；否则显示空态 + 前往生成 CTA。
* **自动关联任务**：提交时由前端携带 `recentTaskId`（最近一次成功任务）；UI 不暴露选择器。
* **输入约束**：

  * `message` 必填，**≥10 字**，≤500 字；实时计数与错误文案。
  * `screenshots` 0..3 张，**JPG/PNG，≤5MB/张**；可删除、排序无要求。
  * `email` 可选，格式校验（不通过则禁用提交）。
* **提交**：

  * 点击 Submit → loading 态 → 成功展示 **Ticket ID**；失败显示错误并可重试（指数退避）。
  * 频率限制：**60s/次**，本地节流 + 接口返回 429 友好提示。
* **A11y**：Textarea 关联 `aria-describedby`（字数与错误）；上传按钮可键盘触发；成功区域 `aria-live="polite"`。

### 5.3 显示字段（Display Fields）

* `Eligibility: { hasCompletedTask: boolean }`
* `RecentTask: { id: string, createdAt: iso8601 }`  // 仅用于提交 payload，不在 UI 显示
* `FeedbackForm: { message: string, screenshots: string[] /*dataUrl or blob refs*/, email?: string }`
* `Limits: { minChars: number, maxChars: number, maxFiles: number, maxSizeMB: number, accept: string[] }`
* `SubmitState: { loading: boolean, error?: string, ticketId?: string }`
* `RateLimit: { seconds: number }`

### 5.4 假数据（Mock JSON）

```json
{
  "eligibility": { "hasCompletedTask": true },
  "recentTask": { "id": "t123", "createdAt": "2025-09-24T12:00:00Z" },
  "limits": { "minChars": 10, "maxChars": 500, "maxFiles": 3, "maxSizeMB": 5, "accept": ["image/jpeg","image/png"] },
  "form": {
    "message": "A few photos look distorted, please review.",
    "screenshots": [],
    "email": "me@example.com"
  },
  "rateLimit": { "seconds": 60 },
  "submit": { "loading": false, "ticketId": "F-20250924-001" }
}
```

### 5.5 DoD（本页通过标准）

* 页面仅包含：**Message**（必填）、**Screenshots**（可选 0..3）、**Email**（可选），以及 Submit。
* 成功后显示 **Ticket ID**；无类型/严重度/任务选择器；最近任务自动关联。
* 图片格式/大小/数量限制可视化提示并强校验；未达 `minChars` 不可提交。
* 未登录或无生成历史时显示相应空态与 CTA。
* 60s 频控、错误可重试、A11y 合规；无 DevHarness 控件混入主体。

> 说明：退款申请未来若需要单独入口，再在 Stage 0/2 更新需求与接口；当前极简版统一进入一条反馈通道即可。



---

好，我把 **Admin** 重画成“最小可见、与我们已简化的前台一致”的版本。直接替换 Stage-1 文档第 6 节即可。

---

## 6) Admin（最小可见 · v2）

**目标**：给运营/你本人一个“一眼看懂”的后台：概览 KPI + 四张表（Users / Tasks / Payments / Tickets）。支持查看详情、基本筛选、分页；**唯一可改动作**：对 Ticket（反馈）做状态流转与备注；所有手动改动落审计日志。其余诸如“退款执行、任务重跑”等在 Stage-5 集成时再开放。

### 6.1 信息架构（IA）

* `/admin`：**Overview**（KPI 卡片） + **四个数据表**（Tabs）

  * Tabs：**Users**｜**Tasks**｜**Payments**｜**Tickets**
* `/admin/feedback`：等价于 `/admin` 的 **Tickets** 页（直达），含**详情 Drawer**与**审计日志**。

### 6.2 盒线稿（Lo-fi）

```
/admin
┌──────────────────────────────────────────────────────────────┐
│ H1: Admin Overview                                           │
│ KPI Row:  Users Total | New Today | Active Tasks | Fail% | Revenue* │ *可为空
├──────────────────────────────────────────────────────────────┤
│ Tabs: [Users] [Tasks] [Payments] [Tickets]                   │
│                                                              │
│ Users (default)                                              │
│  Toolbar: Search email | Plan=All | Sort=Newest | Export CSV │
│  Table cols: Email | Plan | Orders | Tasks | Failed | Joined │
│  Row click → Drawer: user profile + 最近任务/订单列表         │
│                                                              │
│ Tasks                                                        │
│  Filters: Status=all(queued/running/done/error) | Plan       │
│  Cols: TaskID | User | Plan | Status | Created | Completed   │
│  Row click → Drawer: 任务详情 + 错误信息（如有）               │
│                                                              │
│ Payments                                                     │
│  Filters: Status=all(succeeded/failed/refunded) | Provider   │
│  Cols: PayID | User | Plan | Amount | Currency | Status | At │
│  Row click → Drawer: 支付回执摘要                            │
│                                                              │
│ Tickets（反馈）                                              │
│  Filters: Status=new/in_progress/resolved/rejected | HasShots│
│  Cols: TicketID | User | Message(截断) | Screenshots | At | Status |
│  Row click → Drawer（右侧）：                                │
│     上：消息全文、截图缩略图0..3、关联 recentTaskId          │
│     下：内部备注 textarea                                    │
│     操作： [Set in progress] [Resolve] [Reject]              │
│     审计日志：按时间倒序（操作者/动作/时间/备注）             │
└──────────────────────────────────────────────────────────────┘
```

> 注：无“演示控件”混入主体；Dev 工具条仅在 Dev 模式以 `DevToolbar` 出现。

### 6.3 交互

* 表格：分页（默认 20/页）、列排序、基础筛选；导出 CSV 仅导出当前筛选结果。
* Drawer：ESC 关闭；截图可放大预览；Ticket 操作需二次确认并要求填写备注（可空），成功后追加一条**审计日志**。
* 权限：只有 `admin` 角色可访问；未授权重定向到 `/`.
* 只读动作优先：**不提供**“强制退款/重跑任务/改套餐”等重操作（这些留到 Stage-5）。

### 6.4 显示字段（对齐前台简化）

* `AdminKPI: { usersTotal: number, usersToday: number, tasksActive: number, failRatePct: number, revenueUSD?: number }`
* `AdminUserRow: { id: uuid, email: string, plan: 'free'|'start'|'pro'|null, orders: number, tasks: number, failedTasks: number, createdAt: iso8601 }`
* `AdminTaskRow: { id: string, userEmail: string, plan: 'free'|'start'|'pro', status: 'queued'|'running'|'done'|'error', createdAt: iso8601, completedAt?: iso8601, errorCode?: string }`
* `AdminPaymentRow: { id: string, userEmail: string, plan: 'start'|'pro', amount: number, currency: 'USD', provider: 'creem'|'stripe', status: 'succeeded'|'failed'|'refunded', createdAt: iso8601 }`
* `AdminTicketRow: { id: string, userEmail: string, recentTaskId: string, message: string, screenshotUrls: string[], status: 'new'|'in_progress'|'resolved'|'rejected', createdAt: iso8601 }`
* `AdminTicketDetail: { ...AdminTicketRow, internalNotes?: string[] }`
* `AuditLog: { actorEmail: string, action: 'ticket_status_changed'|'ticket_note_added', at: iso8601, note?: string, targetId: string }`

### 6.5 假数据（Mock JSON）

```json
{
  "kpi": { "usersTotal": 1672, "usersToday": 23, "tasksActive": 8, "failRatePct": 1.4, "revenueUSD": 1299.00 },
  "users": [
    { "id":"u1","email":"a@ex.com","plan":"start","orders":1,"tasks":3,"failedTasks":0,"createdAt":"2025-09-24T10:00:00Z" }
  ],
  "tasks": [
    { "id":"t123","userEmail":"a@ex.com","plan":"start","status":"done","createdAt":"2025-09-24T12:00:00Z","completedAt":"2025-09-24T12:12:00Z" },
    { "id":"t124","userEmail":"b@ex.com","plan":"free","status":"error","createdAt":"2025-09-24T13:00:00Z","errorCode":"MODEL_TIMEOUT" }
  ],
  "payments": [
    { "id":"p901","userEmail":"a@ex.com","plan":"start","amount":9.99,"currency":"USD","provider":"creem","status":"succeeded","createdAt":"2025-09-24T12:01:00Z" }
  ],
  "tickets": [
    { "id":"F-20250924-001","userEmail":"a@ex.com","recentTaskId":"t123","message":"A few photos look distorted.","screenshotUrls":[],"status":"new","createdAt":"2025-09-24T13:21:00Z" }
  ],
  "audit": [
    { "actorEmail":"admin@rizzify.com","action":"ticket_status_changed","at":"2025-09-24T13:30:00Z","note":"to in_progress","targetId":"F-20250924-001" }
  ]
}
```

### 6.6 DoD（验收口径）

* `/admin` 可加载 KPI 与四个表（Tabs），具备分页/筛选/排序/CSV 导出（当前筛选）。
* 点击行打开 Drawer；**Tickets** Drawer 支持：状态切换（new ↔ in\_progress ↔ resolved/rejected）与内部备注；每次操作都会**新增审计日志**。
* 管理端不提供重操作（退款执行、任务重跑……）；仅查看与 Ticket 状态流转，避免超范围实现。
* Dev 工具条仅在 Dev 模式出现；**生产构建不可见**。

> 若你后续想增加“退款执行/重跑任务”，我们在 **Stage-5** 的集成文档里新增“动作与接口”，Admin 这边再开放对应按钮与权限即可。


---

## 7) URL & 导航规则

* `/`（首页 Header 你已有版本，不复用功能 Header）
* `/login`（支持 `?redirect=`）
* `/start`（性别+上传 + **6s Preparing**）
* `/gen-image`（套餐 + 支付 Sheet + 同页 Processing）
* `/results/:taskId`（原图+生成图）
* `/feedback`（资格守卫）
* `/admin`，`/admin/feedback`

---

## 8) 组件清单 & Props（需实现的显示字段）

* `Header`, `UserMenu`
* `UploadArea { GenderOption[], SelectedFile, UploadHint }`
* `PlanCard`, `PlansGrid`, `StatusNote`
* `PaymentSheet`, `ProgressCard`
* `ResultGrid`, `ResultCard`, `PreviewDrawer`, `BulkActions`
* `FeedbackForm`, `ContextSelector`, `EligibilityGate`
* `ErrorBanner`, `Skeleton`

---

## 9) 验收视角（本阶段 DoD）

* 五个前台页面（`/login`、`/start`、`/gen-image`、`/results/:taskId`、`/feedback`）都能用**假数据**跑起来；
* 每页覆盖 Loading/Empty/Error/Disabled；
* 所有按钮有去向；路由守卫与资格守卫可被演示；
* 组件 props 与本 PageSpec 的**显示字段**一一对应；
* 响应式/A11y 要点可被演示（断点与键盘操作）。


附录 A · Dev Harness（Stage 1 专用）

目的：在不污染产品 UI 的前提下，演示状态切换与假交互。

呈现方式：固定一条细窄工具条或右上角抽屉（DevToolbar），绝不占据页面主卡片区域。

显示条件：

NODE_ENV !== 'production' 且 (?dev=1 或 localStorage.rizzifyDev='1')

可用控件（示例）：

[DEV] Route: /login（只读）

[DEV] State: default | loading | empty | error | disabled

[DEV] Auth: guest | user | admin（mock）

[DEV] Bypass guard（跳过守卫，仅 MSW/Mock 环境生效）

实现约束：

组件路径：components/dev/DevToolbar.tsx

导航键：Alt+D 切换显示

页面主体不得出现诸如“Sign in（测试用）”“Route/State 标签”等开发文案

验收（Stage 1 DoD 增补）：

生产构建中（NEXT_PUBLIC_ENABLE_DEVTOOLS 未开启）完全不可见

DevHarness 与产品 UI 没有共享样式类名（避免误上）

进度文件 Stage1-Status.json 的 devHarness.controls 与实际实现一致

— 结束 —
