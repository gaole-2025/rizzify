

# Rizzify — Stage 3 · Data Model v1

> 目的：给 Stage 5（真后端/支付/队列/鉴权/审计）提供**落地可实现**的数据模型与生命周期。
> 不含像素级视觉；不含具体模型推理逻辑。

## 0) 范围与关键约束

* 单图上传 → 选择套餐（Free/Start/Pro）→ 生成 → 结果分区展示（Uploaded/Free/Start/Pro）。Free 打水印且 **24h 过期**；Start/Pro **30 天**保留。
* 免费额度每天 **UTC 02:00** 重置（2 张/天）。
* 反馈入口极简：信息 + 最多 3 张截图；**60s/次** 频控；后台仅做状态流转与审计记录。
* Admin：KPI + Users/Tasks/Payments/Tickets 四表，支持只读浏览与 Ticket 状态变更（落审计）。

---

## 1) 实体与关系（ER 视图）

```
users (1) ──< uploads (1) ──< tasks (1) ──< photos
   │                           │  └─< feedback_tickets (可为空, 也可仅关联 user)
   └─< payments                └─< audit_logs (Admin 对任务/工单的操作等)
   └─< daily_quotas (按天聚合/重置)
```

* **users** 账户与登录（Google OAuth）。
* **uploads** 每次有效上传的登记（文件元数据 + 对象存储 key）。
* **tasks** 生成任务（队列/状态机/幂等键）。
* **photos** 结果图与原图记录（按 section 分：`uploaded|free|start|pro`，含 `expires_at`）。
* **payments** 套餐支付记录（Creem/Stripe…回执）。
* **feedback_tickets** 用户反馈（最近任务可选关联）。
* **audit_logs** 管理端手改动作留痕。
* **daily_quotas** 免费额度的日级账本（UTC 02:00 重置）。

---

## 2) 枚举与通用类型

```ts
-- 伪代码/约定
enum plan        { free, start, pro }
enum gender      { male, female }
enum task_status { queued, running, done, error }
enum section     { uploaded, free, start, pro }
enum pay_status  { pending, succeeded, failed, refunded }
enum ticket_status { new, in_progress, resolved, rejected }
```

时间一律 **UTC ISO-8601** 存储；金额以 **整数分** 或 DECIMAL(10,2) 存 USD；对象存储用 **预签名直链** 下载。

---

## 3) 表结构（DDL 草案）

> 以 Postgres 为例（MySQL 可等价替换）。索引根据访问路径最小充分配置，后续可按监控调优。

### 3.1 `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  email           CITEXT UNIQUE NOT NULL,
  name            TEXT,
  avatar_url      TEXT,
  auth_provider   TEXT NOT NULL DEFAULT 'google',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### 3.2 `uploads`

```sql
CREATE TABLE uploads (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  content_type  TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png')),
  size_bytes    BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 20*1024*1024),
  width         INT NOT NULL CHECK (width  >= 768),
  height        INT NOT NULL CHECK (height >= 768),
  object_key    TEXT NOT NULL,                  -- 对象存储路径
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_uploads_user_time ON uploads(user_id, created_at DESC);
```

### 3.3 `tasks`

```sql
CREATE TABLE tasks (
  id               UUID PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  upload_id        UUID NOT NULL REFERENCES uploads(id) ON DELETE RESTRICT,
  plan             TEXT NOT NULL CHECK (plan IN ('free','start','pro')),
  gender           TEXT NOT NULL CHECK (gender IN ('male','female')),
  status           TEXT NOT NULL CHECK (status IN ('queued','running','done','error')),
  progress         INT CHECK (progress BETWEEN 0 AND 100),
  eta_seconds      INT,                          -- 剩余预估（可空）
  error_code       TEXT,                         -- error 时可填
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  idempotency_key  TEXT,                         -- 防重复创建
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX idx_tasks_user_time  ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_status_time ON tasks(status, created_at DESC);
```

### 3.4 `photos`

```sql
CREATE TABLE photos (
  id            UUID PRIMARY KEY,
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  section       TEXT NOT NULL CHECK (section IN ('uploaded','free','start','pro')),
  object_key    TEXT NOT NULL,                 -- 存储路径
  original_name TEXT,                          -- 下载命名参考
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,                   -- Free 有过期；Start/Pro 30d 设定
  deleted_at    TIMESTAMPTZ,                   -- 立删（直链需立即失效）
  UNIQUE (task_id, id, section)
);
CREATE INDEX idx_photos_task_section ON photos(task_id, section, created_at DESC);
CREATE INDEX idx_photos_expiry ON photos(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_photos_deleted ON photos(deleted_at) WHERE deleted_at IS NOT NULL;
```

> 结果页需“分区展示 Uploaded / Free / Start / Pro”，此表以 `section` 区分，便于分区拉取。

### 3.5 `payments`

```sql
CREATE TABLE payments (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL CHECK (plan IN ('start','pro')),  -- free 不入库为支付
  amount_usd    NUMERIC(10,2) NOT NULL,
  provider      TEXT NOT NULL,         -- 'creem'|'stripe'...
  status        TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed','refunded')),
  provider_ref  TEXT,                  -- 第三方会话/支付ID
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_user_time ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments(status);
```

### 3.6 `feedback_tickets`

```sql
CREATE TABLE feedback_tickets (
  id            TEXT PRIMARY KEY,      -- 'F-YYYYMMDD-###'
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  message       TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 500),
  screenshot_urls TEXT[],              -- 最多 3 张（URL/对象键都可）
  email         CITEXT,                -- 可选联系邮箱
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved','rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_user_time ON feedback_tickets(user_id, created_at DESC);
CREATE INDEX idx_tickets_status ON feedback_tickets(status, created_at DESC);
```

> 前台只收“问题+可选截图+可选邮箱”，系统自动关联最近任务（可空）。

### 3.7 `audit_logs`

```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,         -- 'ticket_status_changed'|'ticket_note_added'|...
  target_type  TEXT NOT NULL,         -- 'ticket'|'task'|'payment'
  target_id    TEXT NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id, created_at DESC);
```

### 3.8 `daily_quotas`

```sql
CREATE TABLE daily_quotas (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_utc     DATE NOT NULL,          -- 以 UTC 日期记账，重置点 02:00
  used_count  INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day_utc)
);
CREATE INDEX idx_quotas_user ON daily_quotas(user_id);
```

---

## 4) 存储与命名约定（对象存储）

* Bucket：`rizzify/{env}/photos/…`
* 路径：

  * 原图：`uploads/{userId}/{uploadId}/{filename}`
  * 生成图：`tasks/{taskId}/{section}/{uuid}.jpg`
* 下载命名（前端命名即可，也可由后端 `Content-Disposition` 提供）：
  `taskId_{section}_{index}_{yyyyMMddHHmm}.jpg`（与页面规范一致）。
* **直链失效**：删除/过期后，立刻撤销公开访问（置 `deleted_at` 或检查 `expires_at`，并使签名策略拒绝）。

---

## 5) 生命周期与定时任务（TTL/清理）

* **Free**：`expires_at = created_at + 24h`；到期后清理对象 + 标记数据库；UI 禁用下载/复制。
* **Start/Pro**：`expires_at = created_at + 30 days`；到期清理。
* **每日额度重置**：UTC 02:00 形成新账期（`daily_quotas.day_utc = current_date_utc`），前端文案与 PRD一致。
* 执行方式：

  * cron 每小时扫一次 `photos.expires_at < now()`；
  * cron 每日 02:05 UTC 归档计数/生成报表；
  * 清理时写审计/指标（可选）。

---

## 6) 状态机 & 幂等

### 6.1 任务状态机（`tasks.status`）

```
queued → running → done
         └────────→ error
```

* 进入 `running` 时填 `started_at`；`done/error` 时填 `completed_at`；`progress/eta_seconds` 可选更新。
* **幂等**：`(user_id, idempotency_key)` 唯一，重复请求返回既有 taskId（Stage 2/5 一致）。

### 6.2 支付状态（`payments.status`）

```
pending → succeeded
   └────→ failed
   └────→ refunded (由后台/回调触发)
```

* 成功后触发额度/优先级变更；失败不创建任务；退款仅记账（具体执行业务放 Stage 5）。

### 6.3 Ticket 状态（`feedback_tickets.status`）

```
new → in_progress → resolved | rejected
```

* Admin Drawer 中的状态变更写入 `audit_logs`（动作、备注、操作者）。

---

## 7) 访问路径与索引对齐

* **结果页**：按 `task_id + section` 拉取 `photos`；`created_at DESC`。已配 `idx_photos_task_section`。
* **任务轮询**：`GET tasks/:id`；按主键；`idx_tasks_status_time` 用于后台看板。
* **Admin 列表**：

  * Users：`created_at DESC`；
  * Tasks：`status + created_at`；
  * Payments：`status`、`created_at`；
  * Tickets：`status + created_at`。
* **下载/删除**：按 `photo.id` 精确命中；删除立刻置 `deleted_at` 并撤签名。

---

## 8) 权限与合规（最小）

* 仅 **owner（user_id）** 或 **admin** 可读写其任务/照片/反馈。
* 禁止不当内容（裸露/未成年人/他人肖像等）：在上传/生成中加内容审核标记（扩展列可加 `uploads.review_flag`、`tasks.blocked_reason`），违规即 `error`。
* 个人数据最小化：只存 email、必要的对象键与记录；截图仅与工单关联。

---

## 9) 事件与可观测性（与 Stage 0/1 对齐）

埋点/事件（表或日志，不强制入库）：

* `upload_started`, `task_created`, `task_completed`, `download_clicked`, `feedback_submitted`, `payment_succeeded`, `payment_failed`。
* Admin 操作 → `audit_logs` 永久存证。

---

## 10) 与 API 的对应（Stage 2 合同映射）

* `/uploads:init` → `uploads` 新建行；返回 `fileId` + 直传地址。
* `/generation/start` → 幂等创建 `tasks`（引用 `uploads`）；根据 plan/gender 初始化状态。
* `/tasks/:id` → 读 `tasks`；返回状态/ETA（或由队列服务计算）。
* `/tasks/:id/results` → 汇总 `photos`（四分区）。
* `/photos/:id/download|delete` → 读/标记 `photos`；删除触发对象存储清理。
* `/feedback` → `feedback_tickets` 新建行（附最近 `task_id`）；60s/次频控前端+后端节流。
* `/admin/*` → 只读聚合（+ ticket 状态修改落 `audit_logs`）。

---

## 11) 迁移与种子（最小）

* 初始迁移：创建全部 8 张表与索引；创建 `plan`/`status` 检查约束。
* 种子数据（开发）：1~2 个 demo 用户、2 条任务（done/running）、各区若干 `photos`、1 条 `ticket`、若干 `payments`，以便 Admin 可用。
* 数据一致性：外键 `ON DELETE` 策略如上；照片删除采用 **软删除** + 对象删除双轨。

---

## 12) 风险与后续扩展

* **跨区归档**：30d 到期后是否归档到冷存储（留待增长阶段评估）。
* **多图上传**：若未来放开多张上传，则 `uploads` 与 `tasks` 的关系可从 1:1 扩展为 1:N。
* **退款自动化**：Stage 5 再引入支付回调驱动 `payments.status` 变更与额度回滚。
* **内容审核**：可扩展 `uploads.moderation_score`、`tasks.blocked_reason` 字段。

---

## 13) DoD（本阶段“通过标准”）

* [ ] 上述 8 张表的 DDL 已落库并通过迁移脚本执行。
* [ ] 索引与访问路径一一对应；`EXPLAIN` 观察能命中索引。
* [ ] TTL/清理与 UTC 02:00 重置的 **定时任务** 已配置（开发/预发环境可演示）。
* [ ] 与 Stage 2 合同字段一致（字段名/枚举/约束对齐）；不出现语义冲突。
* [ ] 种子数据使 Admin 四表/Drawer 可演示。
* [ ] 安全基线：按用户隔离数据；删除立刻撤直链。
