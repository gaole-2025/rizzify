#!/bin/bash
# Rizzify Worker 一键部署脚本
# 使用方法：bash deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 Rizzify Worker 部署脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 错误：请在 deployment/worker 目录下运行此脚本${NC}"
    exit 1
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误：Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ 错误：Docker Compose 未安装${NC}"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  警告：.env 文件不存在${NC}"
    echo "正在从 .env.example 创建..."
    cp .env.example .env
    echo -e "${YELLOW}请编辑 .env 文件并填入真实配置，然后重新运行此脚本${NC}"
    exit 1
fi

# 询问用户操作
echo ""
echo "请选择操作："
echo "1) 首次部署（构建并启动）"
echo "2) 更新代码（重新构建并重启）"
echo "3) 仅重启容器"
echo "4) 停止容器"
echo "5) 查看日志"
echo "6) 查看状态"
read -p "请输入选项 (1-6): " choice

case $choice in
    1)
        echo -e "${GREEN}📦 开始首次部署...${NC}"
        
        # 停止可能存在的旧容器
        echo "停止旧容器..."
        docker compose down 2>/dev/null || true
        
        # 构建镜像
        echo "构建 Docker 镜像..."
        docker compose build --no-cache
        
        # 启动容器
        echo "启动容器..."
        docker compose up -d
        
        # 等待容器启动
        echo "等待容器启动..."
        sleep 5
        
        # 检查状态
        echo ""
        echo -e "${GREEN}✅ 部署完成！${NC}"
        echo ""
        docker compose ps
        echo ""
        echo "查看日志: docker compose logs -f rizzify-worker"
        ;;
        
    2)
        echo -e "${GREEN}🔄 开始更新...${NC}"
        
        # 拉取最新代码（如果是 Git 仓库）
        if [ -d "../../.git" ]; then
            echo "拉取最新代码..."
            cd ../..
            git pull origin main || git pull origin master
            cd deployment/worker
        fi
        
        # 停止容器
        echo "停止容器..."
        docker compose down
        
        # 重新构建
        echo "重新构建镜像..."
        docker compose build --no-cache
        
        # 启动容器
        echo "启动容器..."
        docker compose up -d
        
        # 等待启动
        sleep 5
        
        echo ""
        echo -e "${GREEN}✅ 更新完成！${NC}"
        echo ""
        docker compose ps
        ;;
        
    3)
        echo -e "${GREEN}🔄 重启容器...${NC}"
        docker compose restart
        sleep 3
        docker compose ps
        ;;
        
    4)
        echo -e "${YELLOW}🛑 停止容器...${NC}"
        docker compose down
        echo -e "${GREEN}✅ 已停止${NC}"
        ;;
        
    5)
        echo -e "${GREEN}📋 查看日志（Ctrl+C 退出）...${NC}"
        docker compose logs -f rizzify-worker
        ;;
        
    6)
        echo -e "${GREEN}📊 容器状态：${NC}"
        echo ""
        docker compose ps
        echo ""
        echo -e "${GREEN}📊 资源使用：${NC}"
        echo ""
        docker stats --no-stream rizzify-worker
        echo ""
        echo -e "${GREEN}📊 健康检查：${NC}"
        echo ""
        docker inspect rizzify-worker | grep -A 5 "Health" || echo "健康检查未配置"
        ;;
        
    *)
        echo -e "${RED}❌ 无效选项${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}完成！${NC}"
