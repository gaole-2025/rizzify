const fs = require('fs');
const path = require('path');

const projectPath = __dirname;

// 要删除的文件列表
const filesToDelete = [
  // test-*.js 文件
  'test-auth-fixed.js',
  'test-auth-integration.js',
  'test-auth.js',
  'test-complete-flow.js',
  'test-db-connection.js',
  'test-delete-functionality.js',
  'test-env-vars.js',
  'test-final.js',
  'test-pgboss-direct.js',
  'test-queue-send.js',
  'test-queue-task.js',
  'test-stage5-complete.js',
  'test-stage5-fixed.js',
  'test-start-images.js',
  'test-task-flow.js',
  'test-upload-functionality.js',
  
  // 临时文档
  'DELETE-FUNCTIONALITY-SUMMARY.md',
  'GENERATION-STATE-RECOVERY.md',
  'Rizzify_Copywriting_Optimization_EN.md',
  'Rizzify文案优化方案.md',
  'SIMPLE-SOLUTION.md',
  'Stage3-Verification-Checklist.md',
  'UX-IMPROVEMENTS.md',
  'diagnose-issue.md',
  '文案分析与优化建议.md',
  
  // 临时文件
  'temp_payment_error.txt',
  '.rizzify-worker.pid',
  'nul'
];

console.log('🧹 开始删除文件...\n');

let deletedCount = 0;
let errorCount = 0;

filesToDelete.forEach(file => {
  const filePath = path.join(projectPath, file);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ 删除: ${file}`);
      deletedCount++;
    }
  } catch (error) {
    console.log(`❌ 失败: ${file} - ${error.message}`);
    errorCount++;
  }
});

console.log('\n✨ 清理完成！');
console.log(`📊 统计:`);
console.log(`  - 成功删除: ${deletedCount} 个文件`);
console.log(`  - 失败: ${errorCount} 个文件`);
console.log(`\n✅ 项目已清理完毕！`);
