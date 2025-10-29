/**
 * 生成简单的占位符图片 (base64编码的JPG)
 * 不依赖Canvas，使用预定义的base64图片
 */

const fs = require('fs');
const path = require('path');

// 简单的1x1像素JPG base64 (蓝色和粉色)
const MALE_PLACEHOLDER_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';

const FEMALE_PLACEHOLDER_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';

/**
 * 创建占位符图片
 */
async function createPlaceholderImage(filename, outputPath, gender, style) {
  // 选择合适的base64数据
  const base64Data = gender === 'male' ? MALE_PLACEHOLDER_BASE64 : FEMALE_PLACEHOLDER_BASE64;

  // 转换为Buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // 保存为JPG文件
  const filePath = path.join(outputPath, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Created placeholder: ${filePath}`);
}

/**
 * 生成所有占位符图片
 */
function generateAllPlaceholders() {
  const basePath = 'public/templates';

  console.log('🎨 Generating placeholder template images...');

  // Male templates
  const malePath = path.join(basePath, 'male', 'classic');
  if (!fs.existsSync(malePath)) {
    fs.mkdirSync(malePath, { recursive: true });
  }

  for (let i = 1; i <= 5; i++) {
    const filename = `${String(i).padStart(3, '0')}.jpg`;
    createPlaceholderImage(filename, malePath, 'male', 'classic');
  }

  // Female templates
  const femalePath = path.join(basePath, 'female', 'classic');
  if (!fs.existsSync(femalePath)) {
    fs.mkdirSync(femalePath, { recursive: true });
  }

  for (let i = 1; i <= 5; i++) {
    const filename = `${String(i).padStart(3, '0')}.jpg`;
    createPlaceholderImage(filename, femalePath, 'female', 'classic');
  }

  console.log('✅ All placeholder templates generated successfully!');
  console.log('\n📋 Template structure:');
  console.log('public/templates/');
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
}

generateAllPlaceholders();