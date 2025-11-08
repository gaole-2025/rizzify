# Rizzify Worker Dockerfile
# 用于在服务器上运行 AI 图片生成 Worker

FROM node:20-slim

# 安装必要的系统依赖（sharp 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装生产依赖
RUN npm ci --only=production

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY src ./src
COPY lib ./lib
COPY docs ./docs
COPY tsconfig.json ./

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 健康检查（检查进程是否存活）
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f "start-real-worker" || exit 1

# 启动 Worker
CMD ["npx", "tsx", "src/worker/start-real-worker.ts"]
