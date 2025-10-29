# 🚀 Rizzify 部署文档中心

欢迎来到 Rizzify 部署文档！这里包含了将 Worker 部署到服务器的所有资源。

## 📚 文档导航

### 🎯 快速开始（推荐从这里开始）

1. **[部署前检查清单](./PRE_DEPLOYMENT_CHECKLIST.md)** ⭐
   - 部署前必须检查的所有项目
   - 环境配置验证
   - 资源检查

2. **[5 分钟快速部署](./worker/QUICK_START.md)** ⭐⭐⭐
   - 最简化的部署步骤
   - 适合快速上手
   - 包含常见问题解决

3. **[部署方案总结](./DEPLOYMENT_SUMMARY.md)** ⭐⭐
   - GPT-5 方案评估
   - 风险分析
   - 推荐配置

### 📖 详细文档

4. **[完整部署指南](./worker/README.md)**
   - 详细的部署步骤
   - 架构说明
   - 维护与监控
   - 故障排查

### 🛠️ 部署文件

5. **部署配置文件**
   - `worker/Dockerfile` - Docker 镜像定义
   - `worker/docker-compose.yml` - Docker Compose 配置
   - `worker/.env.example` - 环境变量模板
   - `worker/deploy.sh` - 一键部署脚本

## 🎯 推荐阅读顺序

### 第一次部署？按这个顺序：

```
1. PRE_DEPLOYMENT_CHECKLIST.md  ← 检查准备工作
   ↓
2. DEPLOYMENT_SUMMARY.md        ← 了解方案和风险
   ↓
3. QUICK_START.md               ← 开始部署
   ↓
4. README.md                    ← 遇到问题时查阅
```

### 已经部署过？快速操作：

```bash
cd /opt/rizzify-worker/deployment/worker
./deploy.sh  # 选择对应操作
```

## 📊 部署方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Docker** | 隔离性好、易管理、资源可控 | 需要学习 Docker | ⭐⭐⭐⭐⭐ |
| systemd | 不需要 Docker | 依赖管理复杂、资源难控制 | ⭐⭐ |

**我们推荐使用 Docker 方式！**

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    你的服务器 (2GB RAM)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌────────────────────┐      │
│  │   Plausible      │      │  Rizzify Worker    │      │
│  │   (已运行)        │      │  (即将部署)         │      │
│  │                  │      │                    │      │
│  │  - plausible     │      │  - Node.js 20      │      │
│  │  - clickhouse    │      │  - pg-boss         │      │
│  │  - postgres      │      │  - Prisma          │      │
│  │                  │      │  - 512MB 限制      │      │
│  └──────────────────┘      └────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
           ↓                           ↓
    Plausible 统计            AI 图片生成任务
```

## 🔗 外部依赖

Worker 需要访问以下外部服务：

1. **Supabase PostgreSQL** - 数据库和队列
2. **Cloudflare R2** - 对象存储
3. **Apicore API** - AI 图片生成

确保服务器可以访问这些服务！

## ⚡ 快速命令参考

```bash
# 查看状态
cd /opt/rizzify-worker/deployment/worker
docker compose ps

# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 停止
docker compose down

# 更新并重启
./deploy.sh  # 选择 2

# 查看资源使用
docker stats rizzify-worker
```

## 🆘 需要帮助？

1. **部署问题**：查看 [QUICK_START.md](./worker/QUICK_START.md) 的故障排查部分
2. **运行问题**：查看 [README.md](./worker/README.md) 的故障排查部分
3. **性能问题**：查看 [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) 的资源配置部分

## 📝 更新日志

- **2025-01-27**: 初始版本
  - 完整的 Docker 部署方案
  - 详细的文档和检查清单
  - 一键部署脚本

## 🎉 准备好了吗？

开始你的部署之旅：

1. ✅ 阅读 [部署前检查清单](./PRE_DEPLOYMENT_CHECKLIST.md)
2. 🚀 跟随 [5 分钟快速部署](./worker/QUICK_START.md)
3. 🎯 部署成功！

**祝你部署顺利！** 🚀
