/**
 * 上传模板图片到Cloudflare R2
 */

require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// R2配置
const r2Client = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

const TEMPLATES_BUCKET = process.env.CLOUDFLARE_R2_TEMPLATES_BUCKET || 'rizzify-templates';

/**
 * 上传单个文件到R2
 */
async function uploadFile(filePath, bucket, key) {
  try {
    // 读取文件
    const fileData = fs.readFileSync(filePath);
    const contentType = 'image/jpeg';

    // 上传文件
    const result = await r2Client.upload({
      Bucket: bucket,
      Key: key,
      Body: fileData,
      ContentType: contentType,
    }).promise();

    console.log(`✅ Uploaded: ${bucket}/${key}`);
    return result;

  } catch (error) {
    console.error(`❌ Error uploading ${key}:`, error);
    throw error;
  }
}

/**
 * 上传所有模板图片
 */
async function uploadAllTemplates() {
  console.log('📤 Uploading template images to Cloudflare R2...');

  const templateDir = 'public/templates';

  // 检查模板目录是否存在
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Template directory not found: ${templateDir}`);
    console.log('Run "node scripts/generate-placeholders.js" first to create template images.');
    process.exit(1);
  }

  // 检查R2配置
  if (!process.env.CLOUDFLARE_R2_ENDPOINT || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    console.error('❌ Missing R2 configuration. Please check your .env file:');
    console.error('- CLOUDFLARE_R2_ENDPOINT');
    console.error('- CLOUDFLARE_R2_ACCESS_KEY_ID');
    console.error('- CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  // 上传male模板
  const maleDir = path.join(templateDir, 'male', 'classic');
  if (fs.existsSync(maleDir)) {
    console.log('\n👤 Uploading male templates...');
    const maleFiles = fs.readdirSync(maleDir);
    for (const file of maleFiles) {
      const filePath = path.join(maleDir, file);
      await uploadFile(filePath, TEMPLATES_BUCKET, `male/classic/${file}`);
    }
  }

  // 上传female模板
  const femaleDir = path.join(templateDir, 'female', 'classic');
  if (fs.existsSync(femaleDir)) {
    console.log('\n👩 Uploading female templates...');
    const femaleFiles = fs.readdirSync(femaleDir);
    for (const file of femaleFiles) {
      const filePath = path.join(femaleDir, file);
      await uploadFile(filePath, TEMPLATES_BUCKET, `female/classic/${file}`);
    }
  }

  console.log('\n✅ All template images uploaded successfully!');
  console.log('\n📋 Template images in R2 bucket:');
  console.log(`${TEMPLATES_BUCKET}/`);
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