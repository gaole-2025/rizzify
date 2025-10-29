@echo off
REM 用户头像转换和上传脚本

echo.
echo ========================================
echo   Rizzify 用户头像转换和上传
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
echo.

REM 检查依赖
echo 检查依赖...
if not exist "node_modules\sharp" (
    echo ❌ 缺少 sharp 依赖
    echo 运行: npm install sharp
    pause
    exit /b 1
)

if not exist "node_modules\@aws-sdk" (
    echo ❌ 缺少 @aws-sdk 依赖
    echo 运行: npm install @aws-sdk/client-s3
    pause
    exit /b 1
)

echo ✓ 依赖已安装
echo.

REM 检查环境变量
echo 检查环境变量...
if "%CLOUDFLARE_R2_ACCOUNT_ID%"=="" (
    echo ❌ 缺少环境变量: CLOUDFLARE_R2_ACCOUNT_ID
    pause
    exit /b 1
)

if "%CLOUDFLARE_R2_ACCESS_KEY_ID%"=="" (
    echo ❌ 缺少环境变量: CLOUDFLARE_R2_ACCESS_KEY_ID
    pause
    exit /b 1
)

if "%CLOUDFLARE_R2_SECRET_ACCESS_KEY%"=="" (
    echo ❌ 缺少环境变量: CLOUDFLARE_R2_SECRET_ACCESS_KEY
    pause
    exit /b 1
)

echo ✓ 环境变量已配置
echo.

REM 运行脚本
echo 开始转换和上传...
echo.
node scripts/process-avatars.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ 完成！
    echo.
    echo 下一步:
    echo 1. 验证 R2 上传成功
    echo 2. 测试推荐卡片显示
    echo 3. 验证移动端显示
) else (
    echo.
    echo ❌ 脚本执行失败
)

pause
