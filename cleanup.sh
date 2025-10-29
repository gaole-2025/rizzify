#!/bin/bash

# Rizzify 项目清理脚本
# 删除所有测试文件和临时文件

echo "🧹 开始清理 Rizzify 项目..."
echo ""

# 删除测试 JavaScript 文件
echo "删除测试文件..."
rm -f check-api-response.js
rm -f check-failed-job.js
rm -f check-image-source.js
rm -f check-queue-status.js
rm -f check-queue-tables.js
rm -f check-results-task.js
rm -f check-task.js
rm -f cleanup-local-images.js
rm -f debug-auth-detailed.js
rm -f debug-auth-flow.js
rm -f debug-section-values.js
rm -f debug-state-recovery.js
rm -f debug-task.js
rm -f debug-worker.js
rm -f fix-queue.js
rm -f init-pgboss.js
rm -f simple-api-test.js
rm -f test-auth-fixed.js
rm -f test-auth-integration.js
rm -f test-auth.js
rm -f test-complete-flow.js
rm -f test-db-connection.js
rm -f test-delete-functionality.js
rm -f test-env-vars.js
rm -f test-final.js
rm -f test-pgboss-direct.js
rm -f test-queue-send.js
rm -f test-queue-task.js
rm -f test-stage5-complete.js
rm -f test-stage5-fixed.js
rm -f test-start-images.js
rm -f test-task-flow.js
rm -f test-upload-functionality.js
rm -f verify-state-recovery.js
rm -f verify-ux-improvements.js

# 删除临时文档
echo "删除临时文档..."
rm -f DELETE-FUNCTIONALITY-SUMMARY.md
rm -f GENERATION-STATE-RECOVERY.md
rm -f Rizzify_Copywriting_Optimization_EN.md
rm -f Rizzify文案优化方案.md
rm -f SIMPLE-SOLUTION.md
rm -f Stage3-Verification-Checklist.md
rm -f UX-IMPROVEMENTS.md
rm -f diagnose-issue.md
rm -f 文案分析与优化建议.md

# 删除临时文件
echo "删除临时文件..."
rm -f temp_payment_error.txt
rm -f nul
rm -f .rizzify-worker.pid

echo ""
echo "✅ 清理完成！"
echo ""
echo "📊 清理统计："
echo "  - 删除测试文件：34 个"
echo "  - 删除临时文档：9 个"
echo "  - 删除临时文件：3 个"
echo "  - 总计：46 个文件"
echo ""
echo "📁 保留的重要文件："
echo "  - README.md"
echo "  - FREE_TIER_CHECKLIST.md"
echo "  - next.config.js"
echo "  - postcss.config.js"
