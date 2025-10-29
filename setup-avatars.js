#!/usr/bin/env node

/**
 * 完整的头像设置脚本
 * 1. 转换 JPG → WebP
 * 2. 保存到 public/avatars/
 * 3. 更新配置文件
 */

const fs = require('fs');
const path = require('path');

console.log('\n');
console.log('╔════════════════════════════════════════╗');
console.log('║   Rizzify 用户头像完整设置脚本        ║');
console.log('╚════════════════════════════════════════╝');
console.log('\n');

// 检查 sharp 是否安装
try {
  require('sharp');
} catch (e) {
  console.error('❌ 错误: 缺少 sharp 依赖');
  console.error('请运行: npm install sharp');
  process.exit(1);
}

const sharp = require('sharp');

// 用户头像映射
const avatarMap = {
  'pexels-116281951-12089085.jpg': { webp: 'mia.webp', user: 'Mia, 27, London' },
  'pexels-max-medyk-3108397-23885853.jpg': { webp: 'leo.webp', user: 'Leo, 29, Berlin' },
  'pexels-saulo-leite-1491182-19719795.jpg': { webp: 'ava.webp', user: 'Ava, 26, New York' },
  'pexels-trace-2834009.jpg': { webp: 'ken.webp', user: 'Ken, 31, Singapore' },
};

async function setupAvatars() {
  const sourceDir = path.join(__dirname, 'public/images');
  const outputDir = path.join(__dirname, 'public/avatars');

  // 步骤 1: 创建输出目录
  console.log('📁 步骤 1: 创建输出目录...');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`   ✓ 创建: public/avatars/\n`);
  } else {
    console.log(`   ✓ 目录已存在: public/avatars/\n`);
  }

  // 步骤 2: 转换头像
  console.log('🎨 步骤 2: 转换头像 (JPG → WebP)...\n');
  let successCount = 0;
  let errorCount = 0;

  for (const [sourceFile, { webp, user }] of Object.entries(avatarMap)) {
    const sourcePath = path.join(sourceDir, sourceFile);
    const outputPath = path.join(outputDir, webp);

    try {
      if (!fs.existsSync(sourcePath)) {
        console.log(`   ❌ ${user}: 源文件不存在`);
        errorCount++;
        continue;
      }

      // 转换
      await sharp(sourcePath)
        .resize(200, 200, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      
      console.log(`   ✓ ${user}`);
      console.log(`     → ${webp} (${sizeKB}KB)\n`);
      successCount++;

    } catch (error) {
      console.log(`   ❌ ${user}: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('📊 转换统计:');
  console.log(`   - 成功: ${successCount} 个`);
  console.log(`   - 失败: ${errorCount} 个\n`);

  if (successCount !== 4) {
    console.error('❌ 转换失败，请检查错误信息');
    process.exit(1);
  }

  // 步骤 3: 更新配置
  console.log('⚙️  步骤 3: 更新配置文件...\n');

  // 检查 lib/image-urls.ts
  const imageUrlsPath = path.join(__dirname, 'lib/image-urls.ts');
  if (fs.existsSync(imageUrlsPath)) {
    const content = fs.readFileSync(imageUrlsPath, 'utf-8');
    if (content.includes('list: ["mia.webp"')) {
      console.log('   ✓ lib/image-urls.ts: 已更新为 WebP\n');
    } else {
      console.log('   ⚠️  lib/image-urls.ts: 需要手动更新\n');
    }
  }

  // 检查 lib/data.ts
  const dataPath = path.join(__dirname, 'lib/data.ts');
  if (fs.existsSync(dataPath)) {
    const content = fs.readFileSync(dataPath, 'utf-8');
    if (content.includes('AvatarImages.get("mia.webp")')) {
      console.log('   ✓ lib/data.ts: 已更新为 WebP\n');
    } else {
      console.log('   ⚠️  lib/data.ts: 需要手动更新\n');
    }
  }

  // 步骤 4: 完成
  console.log('✅ 设置完成！\n');
  console.log('📝 下一步:');
  console.log('   1. 启动开发服务器: npm run dev');
  console.log('   2. 访问首页验证推荐卡片');
  console.log('   3. 检查头像是否正常显示\n');
  console.log('📁 文件位置: public/avatars/');
  console.log('   - mia.webp');
  console.log('   - leo.webp');
  console.log('   - ava.webp');
  console.log('   - ken.webp\n');
  console.log('💡 提示: 这些文件已保存在本地');
  console.log('   如需上传到 R2，运行: npm run avatars:upload\n');
}

setupAvatars().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
