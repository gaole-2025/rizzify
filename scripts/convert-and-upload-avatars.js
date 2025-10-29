const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// 配置
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'rizzify';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

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
  'pexels-116281951-12089085.jpg': 'mia-london.webp',      // Mia, 27, London
  'pexels-max-medyk-3108397-23885853.jpg': 'leo-berlin.webp', // Leo, 29, Berlin
  'pexels-saulo-leite-1491182-19719795.jpg': 'ava-newyork.webp', // Ava, 26, New York
  'pexels-trace-2834009.jpg': 'ken-singapore.webp',  // Ken, 31, Singapore
};

async function convertAndUploadAvatars() {
  console.log('🎨 开始转换和上传用户头像...\n');

  const imagesDir = path.join(__dirname, '../public/images');
  let successCount = 0;
  let errorCount = 0;

  for (const [originalFile, webpName] of Object.entries(avatarMap)) {
    const originalPath = path.join(imagesDir, originalFile);
    const webpPath = path.join(imagesDir, webpName);

    try {
      // 检查原始文件是否存在
      if (!fs.existsSync(originalPath)) {
        console.log(`❌ 文件不存在: ${originalFile}`);
        errorCount++;
        continue;
      }

      console.log(`📸 处理: ${originalFile}`);

      // 转换为 WebP 格式
      await sharp(originalPath)
        .webp({ quality: 85 })
        .toFile(webpPath);

      console.log(`  ✓ 转换完成: ${webpName}`);

      // 读取 WebP 文件
      const fileBuffer = fs.readFileSync(webpPath);

      // 上传到 R2
      const uploadParams = {
        Bucket: R2_BUCKET,
        Key: `avatars/${webpName}`,
        Body: fileBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000', // 1 年缓存
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      console.log(`  ✓ 上传到 R2: avatars/${webpName}`);
      successCount++;

    } catch (error) {
      console.log(`  ❌ 错误: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n✨ 转换和上传完成！');
  console.log(`📊 统计:`);
  console.log(`  - 成功: ${successCount} 个`);
  console.log(`  - 失败: ${errorCount} 个`);

  if (successCount === 4) {
    console.log('\n✅ 所有头像已成功上传到 R2！');
    console.log('\n📝 R2 URL 列表:');
    console.log('  - https://rizzify.r2.cloudflarestorage.com/avatars/mia-london.webp');
    console.log('  - https://rizzify.r2.cloudflarestorage.com/avatars/leo-berlin.webp');
    console.log('  - https://rizzify.r2.cloudflarestorage.com/avatars/ava-newyork.webp');
    console.log('  - https://rizzify.r2.cloudflarestorage.com/avatars/ken-singapore.webp');
  }
}

convertAndUploadAvatars().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
