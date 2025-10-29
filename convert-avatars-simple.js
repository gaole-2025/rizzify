#!/usr/bin/env node

/**
 * 简化版头像转换脚本
 * 直接转换 JPG → WebP，无需上传到 R2
 * 输出到 public/avatars/ 目录
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 用户头像映射
const avatarMap = {
  'pexels-116281951-12089085.jpg': 'mia.webp',
  'pexels-max-medyk-3108397-23885853.jpg': 'leo.webp',
  'pexels-saulo-leite-1491182-19719795.jpg': 'ava.webp',
  'pexels-trace-2834009.jpg': 'ken.webp',
};

async function convertAvatars() {
  console.log('🎨 开始转换用户头像...\n');

  const sourceDir = path.join(__dirname, 'public/images');
  const outputDir = path.join(__dirname, 'public/avatars');

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 创建输出目录: public/avatars/\n`);
  }

  let successCount = 0;
  let errorCount = 0;

  try {
    for (const [sourceFile, webpName] of Object.entries(avatarMap)) {
      const sourcePath = path.join(sourceDir, sourceFile);
      const outputPath = path.join(outputDir, webpName);

      try {
        // 检查源文件
        if (!fs.existsSync(sourcePath)) {
          console.log(`❌ 文件不存在: ${sourceFile}`);
          errorCount++;
          continue;
        }

        console.log(`📸 处理: ${sourceFile}`);

        // 转换为 WebP（圆形头像优化）
        await sharp(sourcePath)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 85 })
          .toFile(outputPath);

        console.log(`  ✓ 转换完成: ${webpName} (200x200)`);
        console.log(`  ✓ 保存到: public/avatars/${webpName}`);
        
        successCount++;

      } catch (error) {
        console.log(`  ❌ 错误: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n✨ 转换完成！');
    console.log(`📊 统计:`);
    console.log(`  - 成功: ${successCount} 个`);
    console.log(`  - 失败: ${errorCount} 个`);

    if (successCount === 4) {
      console.log('\n✅ 所有头像已成功转换！');
      console.log('\n📝 下一步:');
      console.log('1. 更新 lib/image-urls.ts - 改为使用本地路径');
      console.log('2. 或者手动上传 public/avatars/ 中的文件到 R2');
      console.log('3. 启动开发服务器测试: npm run dev');
      console.log('4. 访问首页验证推荐卡片显示');
    }

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

convertAvatars();
