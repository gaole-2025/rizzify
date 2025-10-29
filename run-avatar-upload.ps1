#!/usr/bin/env pwsh

# Rizzify 用户头像转换和上传脚本

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rizzify 用户头像转换和上传" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "检查 Node.js..." -ForegroundColor Yellow
$nodeCheck = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 错误: 未找到 Node.js" -ForegroundColor Red
    Write-Host "请先安装 Node.js: https://nodejs.org/" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "✓ Node.js 已安装: $nodeCheck" -ForegroundColor Green
Write-Host ""

# 检查依赖
Write-Host "检查依赖..." -ForegroundColor Yellow
$missingDeps = @()

if (-not (Test-Path "node_modules/sharp")) {
    $missingDeps += "sharp"
}

if (-not (Test-Path "node_modules/@aws-sdk")) {
    $missingDeps += "@aws-sdk/client-s3"
}

if ($missingDeps.Count -gt 0) {
    Write-Host "❌ 缺少依赖: $($missingDeps -join ', ')" -ForegroundColor Red
    Write-Host "运行以下命令安装:" -ForegroundColor Yellow
    Write-Host "npm install $($missingDeps -join ' ')" -ForegroundColor Cyan
    Read-Host "按 Enter 退出"
    exit 1
}

Write-Host "✓ 依赖已安装" -ForegroundColor Green
Write-Host ""

# 检查环境变量
Write-Host "检查环境变量..." -ForegroundColor Yellow
$missingEnvVars = @()

if (-not $env:CLOUDFLARE_R2_ACCOUNT_ID) {
    $missingEnvVars += "CLOUDFLARE_R2_ACCOUNT_ID"
}

if (-not $env:CLOUDFLARE_R2_ACCESS_KEY_ID) {
    $missingEnvVars += "CLOUDFLARE_R2_ACCESS_KEY_ID"
}

if (-not $env:CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    $missingEnvVars += "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
}

if ($missingEnvVars.Count -gt 0) {
    Write-Host "❌ 缺少环境变量:" -ForegroundColor Red
    foreach ($var in $missingEnvVars) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "请在 .env 或 .env.local 中配置这些变量" -ForegroundColor Yellow
    Read-Host "按 Enter 退出"
    exit 1
}

Write-Host "✓ 环境变量已配置" -ForegroundColor Green
Write-Host ""

# 运行脚本
Write-Host "开始转换和上传..." -ForegroundColor Yellow
Write-Host ""

node scripts/process-avatars.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 完成！" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步:" -ForegroundColor Cyan
    Write-Host "1. 验证 R2 上传成功" -ForegroundColor White
    Write-Host "2. 测试推荐卡片显示" -ForegroundColor White
    Write-Host "3. 验证移动端显示" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ 脚本执行失败" -ForegroundColor Red
}

Write-Host ""
Read-Host "按 Enter 退出"
