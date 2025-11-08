# Rizzify Worker Dockerfile
# 用于在服务器上运行 AI 图片生成 Worker

FROM node:20-slim

# 清理 apt 缓存以节省空间
RUN rm -rf /var/lib/apt/lists/*

# 安装必要的系统依赖（sharp 需要）
RUN apt-get update -o Acquire::AllowInsecureRepositories=true -o Acquire::AllowUnauthenticatedPackages=true && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
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

# 安装所有依赖（包含 devDependencies，确保 tsx/sharp 可用）
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY src ./src
COPY lib ./lib
COPY docs ./docs
COPY tsconfig.json ./

# 创建非 root 用户
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# 健康检查（检查进程是否存活）
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f "start-real-worker" || exit 1

# 启动 Worker（直接调用本地 tsx，避免 npx 运行时安装）
CMD ["node", "node_modules/tsx/dist/cli.mjs", "src/worker/start-real-worker.ts"]
