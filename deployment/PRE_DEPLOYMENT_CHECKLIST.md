# ✅ Rizzify Worker 部署前检查清单

## 📋 部署前必查项目

### 1. 服务器环境 ✅

- [ ] **服务器规格**
  - RAM: 至少 2GB
  - Swap: 至少 2GB
  - 磁盘: 至少 10GB 可用空间
  - CPU: 至少 1 核心

- [ ] **Docker 已安装**
  ```bash
  docker --version  # 应该 >= 20.10
  docker compose version  # 应该 >= 2.0
  ```

- [ ] **Plausible 正常运行**
  ```bash
  cd /opt/plausible
  docker compose ps  # 所有服务应该是 Up 状态
  ```

- [ ] **防火墙配置**
  - Worker 不需要对外暴露端口
  - 确保可以访问外部 API（Apicore, Supabase, R2）

---

### 2. 数据库配置 ✅

- [ ] **Supabase PostgreSQL 可访问**
  ```bash
  # 测试连接（在本地或服务器）
  psql "postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"
  ```

- [ ] **pg-boss 表已创建**
  - 在 Supabase SQL Editor 运行：
  ```sql
  SELECT * FROM pgboss.version;
  ```
  - 如果表不存在，Worker 首次启动时会自动创建

- [ ] **数据库连接字符串正确**
  - 格式：`postgresql://user:pass@host:port/db?pgbouncer=true&connection_limit=10`
  - 注意：使用 **Pooler 端口**（6543），不是直连端口（5432）

---

### 3. Cloudflare R2 配置 ✅

- [ ] **R2 存储桶已创建**
  - 存储桶名称：`rizzify`
  - 区域：自动选择

- [ ] **R2 API 密钥已创建**
  - Access Key ID
  - Secret Access Key
  - 权限：读写

- [ ] **R2 公开域名已配置**
  - 自定义域名：`https://rizzify.org`
  - 或使用 R2.dev 域名

- [ ] **测试 R2 访问**
  ```bash
  # 使用 AWS CLI 测试（可选）
  aws s3 ls s3://rizzify --endpoint-url=https://xxx.r2.cloudflarestorage.com
  ```

---

### 4. Apicore API 配置 ✅

- [ ] **API 密钥已获取**
  - 格式：`sk-xxxxxxxxxx`
  - 从 Apicore 控制台获取

- [ ] **API 配额充足**
  - 检查剩余配额
  - Pro 套餐 50 张图片 ≈ 50 次 API 调用

- [ ] **测试 API 可访问**
  ```bash
  curl -X POST https://api.apicore.ai/v1/images/generations \
    -H "Authorization: Bearer sk-xxx" \
    -H "Content-Type: application/json" \
    -d '{"model":"gemini-2.5-flash-image-vip","prompt":"test","n":1}'
  ```

---

### 5. 代码准备 ✅

- [ ] **代码已更新到最新版本**
  ```bash
  git pull origin main
  ```

- [ ] **依赖已安装**
  ```bash
  npm install
  ```

- [ ] **Prisma Client 已生成**
  ```bash
  npx prisma generate
  ```

- [ ] **提示词目录文件存在**
  ```bash
  ls docs/catalog/prompt-catalog.full.p2.json
  ls docs/catalog/prompt-catalog.full.p3.json
  ```

- [ ] **环境变量已配置**
  - 复制 `deployment/worker/.env.example` 为 `.env`
  - 填入所有必填项

---

### 6. 环境变量检查 ✅

在 `deployment/worker/.env` 中确认以下配置：

#### 数据库
```bash
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=10&sslmode=require
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

#### R2 存储
```bash
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_TEMPLATES_BUCKET=rizzify
CLOUDFLARE_R2_RESULTS_BUCKET=rizzify
CLOUDFLARE_R2_USER_DATA_DOMAIN=https://rizzify.org
```

#### Apicore API
```bash
APIORE_API_KEY=sk-your-api-key-here
APIORE_API_URL=https://api.apicore.ai/v1/images/generations
APIORE_MODEL=gemini-2.5-flash-image-vip
APIORE_MAX_RETRIES=3
APIORE_BATCH_SIZE=5
APIORE_TIMEOUT_MS=300000
```

#### 套餐配置
```bash
PLAN_FREE_COUNT=2
PLAN_START_COUNT=20
PLAN_PRO_COUNT=50
```

#### 提示词路径
```bash
PROMPT_CATALOG_P2=docs/catalog/prompt-catalog.full.p2.json
PROMPT_CATALOG_P3=docs/catalog/prompt-catalog.full.p3.json
```

#### Node 环境
```bash
NODE_ENV=production
```

---

### 7. 网络连接检查 ✅

在服务器上测试：

```bash
# 测试 Supabase 连接
ping aws-0-us-east-1.pooler.supabase.com

# 测试 Apicore API
curl -I https://api.apicore.ai

# 测试 R2 存储
curl -I https://xxx.r2.cloudflarestorage.com
```

---

### 8. 资源检查 ✅

```bash
# 检查内存
free -h
# 应该有至少 500MB 可用内存

# 检查磁盘
df -h
# /opt 应该有至少 5GB 可用空间

# 检查 swap
swapon --show
# 应该有至少 2GB swap

# 检查 CPU
nproc
# 应该至少 1 个核心
```

---

## 🚀 准备部署

### 所有检查项都通过？

✅ 太好了！你可以开始部署了：

```bash
cd /opt/rizzify-worker/deployment/worker
chmod +x deploy.sh
./deploy.sh  # 选择 1（首次部署）
```

---

### 有检查项未通过？

⚠️ 请先解决问题：

| 问题 | 解决方案 |
|------|---------|
| Docker 未安装 | 参考：https://docs.docker.com/engine/install/ |
| 内存不足 | 增加 swap 或升级服务器 |
| 数据库连接失败 | 检查连接字符串和防火墙 |
| R2 访问失败 | 检查 API 密钥和权限 |
| Apicore API 失败 | 检查 API 密钥和配额 |

---

## 📊 部署后验证清单

部署完成后，检查以下项目：

- [ ] **容器状态**
  ```bash
  docker compose ps
  # 应该显示：rizzify-worker (Up)
  ```

- [ ] **日志正常**
  ```bash
  docker compose logs -f rizzify-worker
  # 应该看到：[RealWorker] Worker started, waiting for jobs...
  # 没有错误信息
  ```

- [ ] **资源使用正常**
  ```bash
  docker stats rizzify-worker
  # 内存 < 512MB
  # CPU < 100%
  ```

- [ ] **健康检查通过**
  ```bash
  docker inspect rizzify-worker | grep -A 5 "Health"
  # Status: healthy
  ```

- [ ] **任务处理正常**
  - 在 Web 端创建一个测试任务
  - 查看 Worker 日志，应该看到任务被处理
  - 检查数据库，任务状态应该更新为 `done`

---

## 🎯 常见问题

### Q1: 如何增加 swap？

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Q2: 如何测试数据库连接？

```bash
# 方式 1：使用 psql
psql "your_database_url"

# 方式 2：使用 Docker
docker run --rm -it postgres:15 psql "your_database_url"
```

### Q3: 如何查看 Plausible 资源使用？

```bash
cd /opt/plausible
docker compose ps
docker stats
```

### Q4: Worker 和 Plausible 会冲突吗？

不会！它们：
- 使用不同的容器（完全隔离）
- 使用不同的端口（Worker 不需要端口）
- 有独立的资源限制
- 有独立的日志

---

## ✅ 最终确认

在开始部署前，请确认：

- [ ] 我已阅读完整的部署文档
- [ ] 所有检查项都已通过
- [ ] 我已准备好 `.env` 文件
- [ ] 我已备份重要数据
- [ ] 我知道如何查看日志和排查问题
- [ ] 我已通知团队即将部署

**准备好了？开始部署吧！** 🚀

```bash
cd /opt/rizzify-worker/deployment/worker
./deploy.sh
```
