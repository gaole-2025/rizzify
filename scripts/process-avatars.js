#!/usr/bin/env node

// 加载环境变量
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // 备用加载 .env

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// 配置
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_RESULTS_BUCKET || process.env.CLOUDFLARE_R2_TEMPLATES_BUCKET || 'rizzify';

// 验证环境变量
if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
  console.error('❌ 缺少 R2 环境变量:');
  console.error('  - CLOUDFLARE_R2_ENDPOINT');
  console.error('  - CLOUDFLARE_R2_ACCESS_KEY_ID');
  console.error('  - CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

// 初始化 R2 客户端
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// 用户头像映射
const avatarMap = {
  'pexels-116281951-12089085.jpg': 'mia.webp',      // Mia, 27, London
  'pexels-max-medyk-3108397-23885853.jpg': 'leo.webp', // Leo, 29, Berlin
  'pexels-saulo-leite-1491182-19719795.jpg': 'ava.webp', // Ava, 26, New York
  'pexels-trace-2834009.jpg': 'ken.webp',  // Ken, 31, Singapore
};

async function processAndUploadAvatars() {
  console.log('🎨 开始处理用户头像...\n');

  const imagesDir = path.join(__dirname, '../public/images');
  const tempDir = path.join(__dirname, '../.temp-avatars');

  // 创建临时目录
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;
  const uploadedFiles = [];

  try {
    for (const [originalFile, webpName] of Object.entries(avatarMap)) {
      const originalPath = path.join(imagesDir, originalFile);
      const webpPath = path.join(tempDir, webpName);

      try {
        // 检查原始文件是否存在
        if (!fs.existsSync(originalPath)) {
          console.log(`❌ 文件不存在: ${originalFile}`);
          errorCount++;
          continue;
        }

        console.log(`📸 处理: ${originalFile}`);

        // 转换为 WebP 格式（圆形头像优化）
        await sharp(originalPath)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 85 })
          .toFile(webpPath);

        console.log(`  ✓ 转换完成: ${webpName} (200x200)`);

        // 读取 WebP 文件
        const fileBuffer = fs.readFileSync(webpPath);

        // 上传到 R2
        const uploadParams = {
          Bucket: R2_BUCKET,
          Key: `ui/avatars/${webpName}`,
          Body: fileBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000', // 1 年缓存
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`  ✓ 上传到 R2: ui/avatars/${webpName}`);
        
        uploadedFiles.push(webpName);
        successCount++;

      } catch (error) {
        console.log(`  ❌ 错误: ${error.message}`);
        errorCount++;
      }
    }

    // 清理临时文件
    console.log('\n🧹 清理临时文件...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('  ✓ 临时文件已删除');

    console.log('\n✨ 处理完成！');
    console.log(`📊 统计:`);
    console.log(`  - 成功: ${successCount} 个`);
    console.log(`  - 失败: ${errorCount} 个`);

    if (successCount === 4) {
      console.log('\n✅ 所有头像已成功上传到 R2！');
      console.log('\n📝 已上传的文件:');
      uploadedFiles.forEach(file => {
        console.log(`  - ${file}`);
      });
      
      console.log('\n📝 更新 image-urls.ts 中的头像列表:');
      console.log('```typescript');
      console.log('export const AvatarImages = {');
      console.log('  get: (filename: string, source?: ImageSource | "auto") =>');
      console.log('    getImageUrl("avatars", filename, source),');
      console.log('');
      console.log('  // 预定义头像列表');
      console.log('  list: ["mia.webp", "leo.webp", "ava.webp", "ken.webp"],');
      console.log('');
      console.log('  // 获取所有头像URLs');
      console.log('  getAll: (source?: ImageSource | "auto") =>');
      console.log('    AvatarImages.list.map((filename) => AvatarImages.get(filename, source)),');
      console.log('};');
      console.log('```');
      
      console.log('\n✨ 下一步: 更新 lib/data.ts 中的头像引用:');
      console.log('```typescript');
      console.log('export const testimonials = [');
      console.log('  {');
      console.log('    name: "Mia",');
      console.log('    age: 27,');
      console.log('    location: "London",');
      console.log('    platform: "Tinder",');
      console.log('    rating: 5,');
      console.log('    text: "Uploaded one photo at lunch—had a new profile by evening.",');
      console.log('    avatar: AvatarImages.get("mia.webp"),');
      console.log('    date: "2025/08",');
      console.log('  },');
      console.log('  // ... 其他用户');
      console.log('];');
      console.log('```');
    }

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

processAndUploadAvatars();
