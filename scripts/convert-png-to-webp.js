const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'public', 'images', 'login');
const outputDir = inputDir; // 输出到同一目录

async function convertPngToWebp() {
  try {
    // 读取目录中的所有文件
    const files = fs.readdirSync(inputDir);

    // 筛选出 PNG 文件
    const pngFiles = files.filter(file =>
      path.extname(file).toLowerCase() === '.png'
    );

    console.log(`Found ${pngFiles.length} PNG files to convert:`);
    pngFiles.forEach(file => console.log(`- ${file}`));

    if (pngFiles.length === 0) {
      console.log('No PNG files found to convert.');
      return;
    }

    // 转换每个 PNG 文件
    for (const pngFile of pngFiles) {
      const inputPath = path.join(inputDir, pngFile);
      const outputFileName = path.basename(pngFile, '.png') + '.webp';
      const outputPath = path.join(outputDir, outputFileName);

      console.log(`Converting ${pngFile} to ${outputFileName}...`);

      try {
        await sharp(inputPath)
          .webp({
            quality: 80,
            effort: 6,
            nearLossless: false
          })
          .toFile(outputPath);

        console.log(`✅ Successfully converted: ${outputFileName}`);

        // 获取文件大小比较
        const originalStats = fs.statSync(inputPath);
        const convertedStats = fs.statSync(outputPath);
        const reduction = ((originalStats.size - convertedStats.size) / originalStats.size * 100).toFixed(1);

        console.log(`   Size: ${(originalStats.size / 1024).toFixed(1)}KB → ${(convertedStats.size / 1024).toFixed(1)}KB (-${reduction}%)`);

      } catch (error) {
        console.error(`❌ Failed to convert ${pngFile}:`, error.message);
      }
    }

    console.log('\n🎉 Conversion completed!');
    console.log('\nConverted files:');

    // 列出所有转换后的文件名供复制使用
    const webpFiles = pngFiles.map(file =>
      path.basename(file, '.png') + '.webp'
    );

    webpFiles.forEach(file => console.log(`'${file}',`));

  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

// 运行转换
convertPngToWebp();
