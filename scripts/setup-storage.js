/**
 * Supabase Storage 设置脚本
 * 创建templates和results buckets
 */

// 这里需要配置你的Supabase项目信息
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

async function setupStorage() {
  console.log('🔧 开始设置Supabase Storage...');

  try {
    // 检查环境变量
    console.log('✅ 环境变量检查通过');
    console.log(`📦 Supabase URL: ${SUPABASE_URL}`);
    console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 10)}...`);

    console.log('\n📋 需要手动创建的Buckets:');
    console.log('1. templates - 存储模板图片');
    console.log('   - 创建目录: male/classic/ 和 female/classic/');
    console.log('   - 上传模板图片到对应目录');

    console.log('\n2. results - 存储生成结果');
    console.log('   - 创建目录: {taskId}/free/, {taskId}/start/, {taskId}/pro/');
    console.log('   - 设置适当的RLS策略');

    console.log('\n📝 模板图片准备指南:');
    console.log('- 准备 male/female 各5张高质量图片');
    console.log('- 图片格式: JPG，建议 1024x1024 像素');
    console.log('- 命名格式: 001.jpg, 002.jpg, 003.jpg, 004.jpg, 005.jpg');
    console.log('- 上传到: templates/male/classic/ 和 templates/female/classic/');

    console.log('\n🚀 下一步: 手动上传模板图片后，继续实现MockWorker');

  } catch (error) {
    console.error('❌ 设置失败:', error);
    process.exit(1);
  }
}

setupStorage();