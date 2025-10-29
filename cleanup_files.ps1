$projectPath = "d:\aiweb\project\rizzify - 副本"
Set-Location $projectPath

Write-Host "🧹 开始清理 Rizzify 项目..." -ForegroundColor Cyan
Write-Host ""

# 要删除的文件列表
$filesToDelete = @(
    # 测试脚本
    "test-auth-fixed.js",
    "test-auth-integration.js",
    "test-auth.js",
    "test-complete-flow.js",
    "test-db-connection.js",
    "test-delete-functionality.js",
    "test-env-vars.js",
    "test-final.js",
    "test-pgboss-direct.js",
    "test-queue-send.js",
    "test-queue-task.js",
    "test-stage5-complete.js",
    "test-stage5-fixed.js",
    "test-start-images.js",
    "test-task-flow.js",
    "test-upload-functionality.js",
    
    # 检查脚本
    "check-api-response.js",
    "check-failed-job.js",
    "check-image-source.js",
    "check-queue-status.js",
    "check-queue-tables.js",
    "check-results-task.js",
    "check-task.js",
    
    # 调试脚本
    "debug-auth-detailed.js",
    "debug-auth-flow.js",
    "debug-section-values.js",
    "debug-state-recovery.js",
    "debug-task.js",
    "debug-worker.js",
    
    # 其他脚本
    "cleanup-local-images.js",
    "fix-queue.js",
    "init-pgboss.js",
    "simple-api-test.js",
    "verify-state-recovery.js",
    "verify-ux-improvements.js",
    
    # 临时文档
    "DELETE-FUNCTIONALITY-SUMMARY.md",
    "GENERATION-STATE-RECOVERY.md",
    "Rizzify_Copywriting_Optimization_EN.md",
    "Rizzify文案优化方案.md",
    "SIMPLE-SOLUTION.md",
    "Stage3-Verification-Checklist.md",
    "UX-IMPROVEMENTS.md",
    "diagnose-issue.md",
    "文案分析与优化建议.md",
    
    # 临时文件
    "temp_payment_error.txt",
    ".rizzify-worker.pid"
)

$deletedCount = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        $deletedCount++
        Write-Host "  ✓ 删除: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ 清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 清理统计:" -ForegroundColor Cyan
Write-Host "  - 删除文件数: $deletedCount 个" -ForegroundColor Yellow
Write-Host ""
Write-Host "📁 保留的重要文件:" -ForegroundColor Cyan
Write-Host "  - README.md" -ForegroundColor Green
Write-Host "  - FREE_TIER_CHECKLIST.md" -ForegroundColor Green
Write-Host "  - MOBILE_ADAPTATION_PLAN.md" -ForegroundColor Green
Write-Host "  - CLEANUP_GUIDE.md" -ForegroundColor Green
Write-Host "  - next.config.js" -ForegroundColor Green
Write-Host "  - postcss.config.js" -ForegroundColor Green
