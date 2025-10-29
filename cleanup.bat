@echo off
REM Rizzify 项目清理脚本 (Windows)
REM 删除所有测试文件和临时文件

echo 🧹 开始清理 Rizzify 项目...
echo.

REM 删除测试 JavaScript 文件
echo 删除测试文件...
del /q check-api-response.js 2>nul
del /q check-failed-job.js 2>nul
del /q check-image-source.js 2>nul
del /q check-queue-status.js 2>nul
del /q check-queue-tables.js 2>nul
del /q check-results-task.js 2>nul
del /q check-task.js 2>nul
del /q cleanup-local-images.js 2>nul
del /q debug-auth-detailed.js 2>nul
del /q debug-auth-flow.js 2>nul
del /q debug-section-values.js 2>nul
del /q debug-state-recovery.js 2>nul
del /q debug-task.js 2>nul
del /q debug-worker.js 2>nul
del /q fix-queue.js 2>nul
del /q init-pgboss.js 2>nul
del /q simple-api-test.js 2>nul
del /q test-auth-fixed.js 2>nul
del /q test-auth-integration.js 2>nul
del /q test-auth.js 2>nul
del /q test-complete-flow.js 2>nul
del /q test-db-connection.js 2>nul
del /q test-delete-functionality.js 2>nul
del /q test-env-vars.js 2>nul
del /q test-final.js 2>nul
del /q test-pgboss-direct.js 2>nul
del /q test-queue-send.js 2>nul
del /q test-queue-task.js 2>nul
del /q test-stage5-complete.js 2>nul
del /q test-stage5-fixed.js 2>nul
del /q test-start-images.js 2>nul
del /q test-task-flow.js 2>nul
del /q test-upload-functionality.js 2>nul
del /q verify-state-recovery.js 2>nul
del /q verify-ux-improvements.js 2>nul

REM 删除临时文档
echo 删除临时文档...
del /q DELETE-FUNCTIONALITY-SUMMARY.md 2>nul
del /q GENERATION-STATE-RECOVERY.md 2>nul
del /q Rizzify_Copywriting_Optimization_EN.md 2>nul
del /q "Rizzify文案优化方案.md" 2>nul
del /q SIMPLE-SOLUTION.md 2>nul
del /q Stage3-Verification-Checklist.md 2>nul
del /q UX-IMPROVEMENTS.md 2>nul
del /q diagnose-issue.md 2>nul
del /q "文案分析与优化建议.md" 2>nul

REM 删除临时文件
echo 删除临时文件...
del /q temp_payment_error.txt 2>nul
del /q nul 2>nul
del /q .rizzify-worker.pid 2>nul

echo.
echo ✅ 清理完成！
echo.
echo 📊 清理统计：
echo   - 删除测试文件：34 个
echo   - 删除临时文档：9 个
echo   - 删除临时文件：3 个
echo   - 总计：46 个文件
echo.
echo 📁 保留的重要文件：
echo   - README.md
echo   - FREE_TIER_CHECKLIST.md
echo   - next.config.js
echo   - postcss.config.js
echo.
pause
