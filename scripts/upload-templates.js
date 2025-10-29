/**
 * 上传模板图片到Supabase Storage
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 上传单个文件到Supabase Storage
 */
async function uploadFile(bucket, filePath, fileName) {
  try {
    // 读取文件
    const fileData = fs.readFileSync(filePath);
    const contentType = 'image/svg+xml'; // 我们的占位符是SVG

    // 上传文件
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileData, {
        contentType,
        cacheControl: '31536000', // 1年缓存
        upsert: true
      });

    if (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error);
      throw error;
    }

    console.log(`✅ Uploaded: ${bucket}/${fileName}`);
    return data;

  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    throw error;
  }
}

/**
 * 上传所有模板图片
 */
async function uploadAllTemplates() {
  console.log('📤 Uploading template images to Supabase Storage...');

  const templateDir = 'public/templates';

  // 检查模板目录是否存在
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Template directory not found: ${templateDir}`);
    console.log('Run "node scripts/generate-placeholders.js" first to create template images.');
    process.exit(1);
  }

  // 上传male模板
  const maleDir = path.join(templateDir, 'male', 'classic');
  if (fs.existsSync(maleDir)) {
    console.log('\n👤 Uploading male templates...');
    const maleFiles = fs.readdirSync(maleDir);
    for (const file of maleFiles) {
      const filePath = path.join(maleDir, file);
      await uploadFile('templates', filePath, `male/classic/${file}`);
    }
  }

  // 上传female模板
  const femaleDir = path.join(templateDir, 'female', 'classic');
  if (fs.existsSync(femaleDir)) {
    console.log('\n👩 Uploading female templates...');
    const femaleFiles = fs.readdirSync(femaleDir);
    for (const file of femaleFiles) {
      const filePath = path.join(femaleDir, file);
      await uploadFile('templates', filePath, `female/classic/${file}`);
    }
  }

  console.log('\n✅ All template images uploaded successfully!');
  console.log('\n📋 Template images in Supabase Storage:');
  console.log('templates/');
  console.log('├── male/');
  console.log('│   └── classic/');
  console.log('│       ├── 001.jpg');
  console.log('│       ├── 002.jpg');
  console.log('│       ├── 003.jpg');
  console.log('│       ├── 004.jpg');
  console.log('│       └── 005.jpg');
  console.log('└── female/');
  console.log('    └── classic/');
  console.log('        ├── 001.jpg');
  console.log('        ├── 002.jpg');
  console.log('        ├── 003.jpg');
  console.log('        ├── 004.jpg');
  console.log('        └── 005.jpg');

  console.log('\n🎉 Template setup completed!');
  console.log('Now the MockWorker can use these templates for image generation.');
}

uploadAllTemplates();