# 🚀 Rizzify Worker 部署方案总结

## 📋 方案评估

### ✅ GPT-5 建议的可行性

**完全可行！** 但需要针对你的项目做以下调整：

| GPT-5 建议 | 你的项目实际情况 | 调整方案 |
|-----------|----------------|---------|
| 使用 Redis 队列 | ❌ 使用 pg-boss (PostgreSQL) | ✅ 不需要 Redis，简化部署 |
| 简单定时任务 | ❌ 复杂的 AI 图片生成流程 | ✅ 已适配完整 Worker 逻辑 |
| 不需要数据库 | ❌ 需要 Supabase PostgreSQL | ✅ 已配置数据库连接 |
| 不需要对象存储 | ❌ 需要 Cloudflare R2 | ✅ 已配置 R2 访问 |
| 纯 Node.js | ✅ Node.js + TypeScript | ✅ 使用 tsx 运行 |

---

## ⚠️ 风险评估与解决方案

### 🔴 高风险：内存不足

**问题**：2GB RAM 要运行 Plausible + ClickHouse + Worker

**解决方案**：
1. ✅ **严格资源限制**：Worker 最多 512MB
2. ✅ **启用 swap**：2GB swap 已配置
3. ✅ **日志轮转**：避免日志占用磁盘
4. ✅ **监控告警**：内存超过 90% 时告警

**验证**：
```bash
# 查看总内存使用
free -h

# 查看 Worker 内存
docker stats rizzify-worker

# 应该看到：
# - Worker: < 512MB
# - 总使用: < 1.8GB（留 200MB 余量）
```

---

### 🟡 中风险：数据库连接池

**问题**：Worker 并发 8 个线程，可能占用过多数据库连接

**解决方案**：
1. ✅ **连接池限制**：`connection_limit=10`
2. ✅ **使用 Pooler**：Supabase pgBouncer
3. ✅ **批量操作**：使用 `createMany` 减少查询

**验证**：
```bash
# 在 Supabase Dashboard 查看活跃连接数
# 应该 < 10 个
```

---

### 🟢 低风险：API 超时

**问题**：Apicore API 可能很慢或超时

**解决方案**：
1. ✅ **已有重试机制**：最多 3 次
2. ✅ **超时设置**：300 秒（5 分钟）
3. ✅ **错误处理**：单张失败不影响整体

**无需额外配置**

---

## 📦 部署文件清单

已创建以下文件：

```
deployment/worker/
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 配置
├── .env.example           # 环境变量模板
├── .dockerignore          # Docker 忽略文件
├── deploy.sh              # 一键部署脚本
├── README.md              # 完整部署文档
└── QUICK_START.md         # 5 分钟快速部署指南
```

---

## 🎯 部署方式对比

### 方式 A：Docker（推荐）⭐⭐⭐⭐⭐

**优点**：
- ✅ 与 Plausible 隔离，互不影响
- ✅ 资源限制精确（512MB 内存，1 CPU）
- ✅ 日志管理自动化
- ✅ 一键部署、更新、回滚
- ✅ 开机自启（`restart: unless-stopped`）

**缺点**：
- ⚠️ 需要学习 Docker 基础命令（但很简单）

**适合**：✅ **你的项目（强烈推荐）**

---

### 方式 B：systemd（不推荐）⭐⭐

**优点**：
- ✅ 不需要 Docker

**缺点**：
- ❌ 依赖管理复杂（Node.js, npm, sharp 等）
- ❌ 资源限制不精确
- ❌ 日志管理需要手动配置
- ❌ 更新麻烦（需要手动停止、更新、重启）
- ❌ 与 Plausible 可能冲突

**适合**：❌ **不适合你的项目**

---

## 🚀 推荐部署流程

### 第 1 步：本地准备（5 分钟）

```bash
# 在 Windows 本地
cd "d:\aiweb\project\rizzify - 副本"

# 打包代码
tar -czf rizzify-worker.tar.gz \
  src/ lib/ docs/ prisma/ \
  package.json package-lock.json tsconfig.json \
  deployment/worker/
```

### 第 2 步：上传到服务器（2 分钟）

```bash
# 上传
scp rizzify-worker.tar.gz root@149.28.122.140:/opt/

# SSH 登录
ssh root@your-server-ip

# 解压
cd /opt
mkdir -p rizzify-worker
tar -xzf rizzify-worker.tar.gz -C rizzify-worker/
cd rizzify-worker/deployment/worker
```

### 第 3 步：配置环境变量（3 分钟）

```bash
# 复制模板
cp .env.example .env

# 编辑配置
nano .env

# 填入以下必填项：
# - DATABASE_URL（Supabase）
# - CLOUDFLARE_R2_*（R2 配置）
# - APIORE_API_KEY（Apicore）
```

### 第 4 步：一键部署（5 分钟）

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署
./deploy.sh

# 选择 1（首次部署）
# 等待构建完成...
```

### 第 5 步：验证（2 分钟）

```bash
# 查看状态
docker compose ps
# 应该显示：rizzify-worker (Up)

# 查看日志
docker compose logs -f rizzify-worker
# 应该看到：[RealWorker] Worker started, waiting for jobs...

# 查看资源
docker stats rizzify-worker
# 内存应该 < 512MB
```

**总耗时：约 15-20 分钟**

---

## 📊 资源配置建议

### 当前服务器（2GB RAM）

```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.0'      # 1 个 CPU 核心
      memory: 512M     # 512MB 内存
```

```typescript
// src/worker/real-worker.ts
const WORKER_CONFIG = {
  teamSize: 8,  // 8 个并发线程
};
```

**预期性能**：
- Free (2张): ~10 秒
- Start (20张): ~1-2 分钟
- Pro (50张): ~2-3 分钟

---

### 如果升级到 4GB RAM

```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '2.0'      # 2 个 CPU 核心
      memory: 1G       # 1GB 内存
```

```typescript
// src/worker/real-worker.ts
const WORKER_CONFIG = {
  teamSize: 16,  // 16 个并发线程
};
```

**预期性能**：
- Free (2张): ~5 秒
- Start (20张): ~30-60 秒
- Pro (50张): ~1-2 分钟

---

## 🔧 维护与监控

### 日常维护

```bash
# 查看日志
docker compose logs -f

# 查看状态
docker compose ps

# 查看资源
docker stats rizzify-worker

# 重启
docker compose restart
```

### 更新代码

```bash
# 方式 1：使用部署脚本
./deploy.sh  # 选择 2

# 方式 2：手动更新
git pull origin main
docker compose up -d --build
```

### 监控告警

已提供监控脚本（见 `QUICK_START.md`），可以：
- 监控内存使用
- 监控容器健康状态
- 发送告警（需要自行配置邮件/Webhook）

---

## ✅ 与 GPT-5 方案的协作

### GPT-5 提供的通用框架 ✅

- Docker Compose 结构
- 资源限制配置
- 日志管理
- 健康检查

### 我针对你的项目的定制 ✅

- 适配 pg-boss（不需要 Redis）
- 添加 Prisma 支持
- 配置 R2 和 Supabase
- 优化 Node.js + TypeScript 构建
- 添加 sharp 依赖（图片处理）
- 创建一键部署脚本
- 提供完整文档

---

## 🎯 最终建议

### ✅ 推荐方案

**使用 Docker 方式部署**，理由：
1. 与 Plausible 完美隔离
2. 资源控制精确
3. 部署、更新、回滚都很简单
4. 日志管理自动化
5. 开机自启

### ⚠️ 注意事项

1. **内存监控**：定期检查 `docker stats`
2. **日志清理**：已自动配置，但建议定期检查
3. **数据库连接**：注意连接池限制
4. **API 配额**：监控 Apicore API 使用量

### 📈 未来优化

如果业务增长，可以考虑：
1. 升级服务器到 4GB RAM
2. 增加 Worker 并发数
3. 使用专门的队列服务器（分离 Web 和 Worker）
4. 添加负载均衡（多个 Worker 实例）

---

## 🆘 需要帮助？

1. **快速开始**：查看 `QUICK_START.md`
2. **完整文档**：查看 `README.md`
3. **故障排查**：查看日志 `docker compose logs -f`
4. **联系我**：如果遇到问题，提供日志截图

---

**准备好了吗？开始部署吧！** 🚀

按照 `QUICK_START.md` 的步骤，15 分钟内就能完成部署！
