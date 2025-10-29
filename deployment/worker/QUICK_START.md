# 🚀 Rizzify Worker 快速部署指南

## ⏱️ 5 分钟部署

### 前置条件

✅ 你已经有：
- 一台 Linux 服务器（2GB RAM + 2GB swap）
- Docker 和 Docker Compose 已安装
- Plausible 已在同一服务器运行
- Supabase PostgreSQL 数据库
- Cloudflare R2 存储
- Apicore API 密钥

### 步骤 1：上传代码到服务器

```bash
# 在本地打包代码
cd "d:\aiweb\project\rizzify - 副本"
tar -czf rizzify-worker.tar.gz \
  src/ \
  lib/ \
  docs/ \
  prisma/ \
  package.json \
  package-lock.json \
  tsconfig.json \
  deployment/worker/

# 上传到服务器
scp rizzify-worker.tar.gz root@your-server-ip:/opt/

# SSH 登录服务器
ssh root@your-server-ip

# 解压
cd /opt
mkdir -p rizzify-worker
tar -xzf rizzify-worker.tar.gz -C rizzify-worker/
cd rizzify-worker/deployment/worker
```

### 步骤 2：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置（填入真实值）
nano .env
```

**必填项**：
```bash
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10
CLOUDFLARE_R2_ACCESS_KEY_ID=your_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret
APIORE_API_KEY=sk-your-api-key
```

按 `Ctrl+X`，然后 `Y`，然后 `Enter` 保存。

### 步骤 3：一键部署

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh

# 选择 1（首次部署）
```

### 步骤 4：验证运行

```bash
# 查看容器状态
docker compose ps

# 查看日志（应该看到 "Worker started" 和任务处理日志）
docker compose logs -f rizzify-worker

# 查看资源使用
docker stats rizzify-worker
```

**成功标志**：
```
✅ Container: rizzify-worker (Up)
✅ 日志显示: [RealWorker] Worker started, waiting for jobs...
✅ 内存使用: < 512MB
```

---

## 🔧 常用命令速查

```bash
cd /opt/rizzify-worker/deployment/worker

# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 停止
docker compose down

# 更新代码并重启
./deploy.sh  # 选择 2

# 查看状态
./deploy.sh  # 选择 6
```

---

## ⚠️ 故障排查

### 问题 1：容器无法启动

```bash
# 查看详细错误
docker compose logs rizzify-worker

# 常见原因：
# 1. 环境变量配置错误 → 检查 .env
# 2. 数据库连接失败 → 检查 DATABASE_URL
# 3. 端口冲突 → 检查是否有其他服务占用
```

### 问题 2：内存不足

```bash
# 查看内存使用
free -h
docker stats

# 解决方案：
# 1. 确保 swap 已启用
# 2. 降低 Worker 并发数（编辑 src/worker/real-worker.ts，teamSize: 8 → 4）
# 3. 重新构建：./deploy.sh 选择 2
```

### 问题 3：任务不执行

```bash
# 检查数据库连接
docker compose exec rizzify-worker sh
npx prisma db pull

# 检查队列表
# 在 Supabase SQL Editor 中运行：
# SELECT * FROM pgboss.job WHERE name = 'task_generate' ORDER BY createdon DESC LIMIT 10;
```

---

## 📊 监控建议

### 1. 设置日志监控

```bash
# 安装 logrotate（如果没有）
apt-get install logrotate

# 创建配置
cat > /etc/logrotate.d/docker-rizzify-worker <<EOF
/var/lib/docker/containers/*rizzify-worker*/*-json.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

### 2. 设置资源告警

```bash
# 创建监控脚本
cat > /opt/monitor-worker.sh <<'EOF'
#!/bin/bash
MEMORY=$(docker stats --no-stream rizzify-worker --format "{{.MemPerc}}" | sed 's/%//')
if (( $(echo "$MEMORY > 90" | bc -l) )); then
    echo "⚠️ Worker 内存使用过高: ${MEMORY}%"
    # 可以在这里添加告警逻辑（发邮件/Webhook等）
fi
EOF

chmod +x /opt/monitor-worker.sh

# 添加到 crontab（每 5 分钟检查一次）
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/monitor-worker.sh") | crontab -
```

---

## 🎯 性能优化

### 当前配置（2GB RAM）

- ✅ Worker 并发: 8 个线程
- ✅ 内存限制: 512MB
- ✅ CPU 限制: 1 核心

### 如果服务器升级到 4GB RAM

编辑 `docker-compose.yml`：
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
```

编辑 `src/worker/real-worker.ts`：
```typescript
const WORKER_CONFIG = {
  teamSize: 16,  // 从 8 改为 16
};
```

然后重新部署：
```bash
./deploy.sh  # 选择 2
```

---

## ✅ 部署检查清单

- [ ] Docker 和 Docker Compose 已安装
- [ ] 代码已上传到 `/opt/rizzify-worker`
- [ ] `.env` 文件已配置（所有必填项）
- [ ] 容器已启动（`docker compose ps` 显示 Up）
- [ ] 日志正常（`docker compose logs` 无错误）
- [ ] 内存使用正常（< 512MB）
- [ ] 测试任务已执行（在 Web 端创建任务，查看是否被处理）

---

## 🆘 需要帮助？

1. **查看完整文档**：`README.md`
2. **查看日志**：`docker compose logs -f`
3. **检查资源**：`docker stats`
4. **联系开发团队**

---

**部署完成后，你的 Worker 将自动处理来自 Web 应用的 AI 图片生成任务！** 🎉
