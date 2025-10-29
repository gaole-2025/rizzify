# Rizzify Worker Dockerfile
# 用于在服务器上运行 AI 图片生成 Worker

FROM node:20-alpine

# 安装必要的系统依赖（sharp 需要）
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

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
