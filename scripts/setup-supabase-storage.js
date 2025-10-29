/**
 * Supabase Storage 设置脚本
 * 创建必要的buckets和设置RLS策略
 */

const { createClient } = require('@supabase/supabase-js');

// 加载环境变量
require('dotenv').config({ path: '.env' });

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少Supabase环境变量');
  console.error('需要设置:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...');

  try {
    // 检查现有buckets
    console.log('\n📋 Checking existing buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Failed to list buckets:', error);
      throw error;
    }

    console.log('Existing buckets:', buckets.map(b => b.name));

    // 创建templates bucket
    if (!buckets.find(b => b.name === 'templates')) {
      console.log('\n📁 Creating templates bucket...');
      const { error: createError } = await supabase.storage.createBucket('templates', {
        public: false, // 私有bucket
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('❌ Failed to create templates bucket:', createError);
        throw createError;
      }
      console.log('✅ Templates bucket created');
    } else {
      console.log('✅ Templates bucket already exists');
    }

    // 创建results bucket
    if (!buckets.find(b => b.name === 'results')) {
      console.log('\n📁 Creating results bucket...');
      const { error: createError } = await supabase.storage.createBucket('results', {
        public: false, // 私有bucket
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('❌ Failed to create results bucket:', createError);
        throw createError;
      }
      console.log('✅ Results bucket created');
    } else {
      console.log('✅ Results bucket already exists');
    }

    // 设置RLS策略（简化版本）
    console.log('\n🔒 Setting up RLS policies...');

    // Templates bucket policies (service role only)
    try {
      // 创建templates策略
      const { error: policyError } = await supabase.rpc('create_policy', {
        policy_name: 'templates_service_role',
        definition: `
          CREATE POLICY "Service role can manage templates" ON storage.objects
          FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (bucket_id = 'templates')
        `
      });

      if (policyError) {
        console.warn('⚠️  Failed to create templates policy (may already exist):', policyError.message);
      }
    } catch (error) {
      console.warn('⚠️  RLS policy setup may need manual configuration');
    }

    // Results bucket policies (service role + authenticated users)
    try {
      // 创建results策略
      const { error: policyError } = await supabase.rpc('create_policy', {
        policy_name: 'results_service_role',
        definition: `
          CREATE POLICY "Service role can manage results" ON storage.objects
          FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (bucket_id = 'results')
        `
      });

      if (policyError) {
        console.warn('⚠️  Failed to create results policy (may already exist):', policyError.message);
      }
    } catch (error) {
      console.warn('⚠️  RLS policy setup may need manual configuration');
    }

    console.log('\n✅ Supabase Storage setup completed!');
    console.log('\n📋 Buckets created:');
    console.log('- templates: 存储模板图片');
    console.log('- results: 存储生成结果');

    console.log('\n📝 Next steps:');
    console.log('1. 上传模板图片到 Supabase Storage');
    console.log('2. 测试文件上传和下载功能');
    console.log('3. 验证RLS策略是否正确');

  } catch (error) {
    console.error('❌ Storage setup failed:', error);
    throw error;
  }
}

setupStorage();