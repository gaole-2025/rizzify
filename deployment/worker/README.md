# Rizzify Worker 部署指南

## 📋 概述

这是 Rizzify AI 图片生成 Worker 的 Docker 部署配置。Worker 负责：
- 从 pg-boss 队列中获取任务
- 调用 Apicore API 生成 AI 图片
- 处理图片上传到 Cloudflare R2
- 更新数据库状态

## 🏗️ 架构说明

```
Next.js Web App (rizzify.org)
    ↓ 创建任务
PostgreSQL (Supabase) + pg-boss 队列
    ↓ Worker 拉取任务
Rizzify Worker (Docker 容器)
    ↓ 调用 API
Apicore Gemini 2.5 Flash
    ↓ 生成图片
Cloudflare R2 存储
```

## 📦 部署步骤

### 1. 准备服务器环境

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 创建部署目录
mkdir -p /opt/rizzify-worker
cd /opt/rizzify-worker
```

### 2. 上传文件到服务器

将以下文件上传到 `/opt/rizzify-worker/`：
- `Dockerfile`
- `docker-compose.yml`
- `.env` (从 `.env.example` 复制并填入真实值)
- 整个项目代码（或通过 Git 克隆）

**推荐方式：使用 Git**
```bash
cd /opt/rizzify-worker
git clone https://github.com/your-username/rizzify.git .
# 或者如果已经有代码，直接 rsync/scp 上传
```

### 3. 配置环境变量

```bash
cd /opt/rizzify-worker/deployment/worker
cp .env.example .env
nano .env  # 编辑并填入真实的配置
```

**重要配置项**：
- `DATABASE_URL`: Supabase PostgreSQL 连接字符串
- `CLOUDFLARE_R2_*`: R2 存储配置
- `APIORE_API_KEY`: Apicore API 密钥

### 4. 构建并启动

```bash
cd /opt/rizzify-worker/deployment/worker

# 构建镜像
docker compose build

# 启动容器（后台运行）
docker compose up -d

# 查看日志
docker compose logs -f
```

### 5. 验证运行状态

```bash
# 查看容器状态
docker compose ps

# 查看实时日志
docker compose logs -f rizzify-worker

# 查看资源使用
docker stats rizzify-worker

# 检查健康状态
docker inspect rizzify-worker | grep -A 10 Health
```

## 🔧 常用命令

### 启动/停止/重启

```bash
cd /opt/rizzify-worker/deployment/worker

# 启动
docker compose up -d

# 停止
docker compose down

# 重启
docker compose restart

# 重新构建并启动
docker compose up -d --build
```

### 日志管理

```bash
# 查看最近 100 行日志
docker compose logs --tail=100 rizzify-worker

# 实时跟踪日志
docker compose logs -f rizzify-worker

# 查看特定时间的日志
docker compose logs --since="2025-01-27T10:00:00" rizzify-worker
```

### 更新代码

```bash
cd /opt/rizzify-worker

# 拉取最新代码
git pull origin main

# 重新构建并启动
cd deployment/worker
docker compose up -d --build
```

### 进入容器调试

```bash
# 进入容器 shell
docker compose exec rizzify-worker sh

# 查看进程
docker compose exec rizzify-worker ps aux

# 查看环境变量
docker compose exec rizzify-worker env
```

## 📊 监控与维护

### 资源监控

```bash
# 查看容器资源使用
docker stats rizzify-worker

# 查看服务器整体资源
htop
free -h
df -h
```

### 日志清理

日志会自动轮转（最多 3 个文件，每个 10MB），但如果需要手动清理：

```bash
# 清理所有 Docker 日志
docker compose down
rm -rf /var/lib/docker/containers/*/*-json.log
docker compose up -d
```

### 数据库连接检查

```bash
# 进入容器
docker compose exec rizzify-worker sh

# 测试数据库连接
npx prisma db pull --schema=./prisma/schema.prisma
```

## ⚠️ 故障排查

### Worker 无法启动

1. **检查日志**：
   ```bash
   docker compose logs rizzify-worker
   ```

2. **检查环境变量**：
   ```bash
   docker compose exec rizzify-worker env | grep DATABASE_URL
   ```

3. **检查数据库连接**：
   ```bash
   docker compose exec rizzify-worker npx prisma db pull
   ```

### 内存不足

如果出现 OOM (Out of Memory)：

1. **增加 swap**（如果还没有）：
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

2. **降低 Worker 并发数**：
   编辑 `src/worker/real-worker.ts`，将 `teamSize` 从 8 改为 4 或 2

3. **减少内存限制**：
   编辑 `docker-compose.yml`，将 `memory` 从 512M 改为 384M

### 任务处理缓慢

1. **检查 API 响应时间**：
   查看日志中的 API 调用耗时

2. **检查网络连接**：
   ```bash
   docker compose exec rizzify-worker ping -c 3 api.apicore.ai
   ```

3. **增加并发数**（如果内存足够）：
   编辑 `src/worker/real-worker.ts`，增加 `teamSize`

## 🔒 安全建议

1. **不要提交 .env 文件**：
   ```bash
   echo ".env" >> .gitignore
   ```

2. **定期更新依赖**：
   ```bash
   npm audit
   npm update
   ```

3. **限制容器权限**：
   已在 Dockerfile 中使用非 root 用户运行

4. **备份环境变量**：
   ```bash
   cp .env .env.backup
   ```

## 📈 性能优化

### 当前配置（2GB RAM 服务器）

- **Worker 并发数**: 8 个线程
- **内存限制**: 512MB
- **CPU 限制**: 1 核心
- **预期吞吐量**: 
  - Free (2张): ~10秒
  - Start (20张): ~1-2分钟
  - Pro (50张): ~2-3分钟

### 如果服务器升级到 4GB RAM

可以调整 `docker-compose.yml`：
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
```

并增加 Worker 并发数到 16。

## 🆘 获取帮助

如果遇到问题：
1. 查看日志：`docker compose logs -f`
2. 检查健康状态：`docker compose ps`
3. 查看资源使用：`docker stats`
4. 联系开发团队

## 📝 版本历史

- **v1.0.0** (2025-01-27): 初始版本
  - 支持 pg-boss 队列
  - 集成 Apicore API
  - Docker 容器化部署
