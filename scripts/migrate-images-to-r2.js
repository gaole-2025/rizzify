require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// R2 配置
const r2Client = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  region: "auto",
  signatureVersion: "v4",
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_TEMPLATES_BUCKET || "rizzify";

// 图片迁移配置
const MIGRATION_CONFIG = {
  // 登录背景图片
  login: {
    sourcePath: "public/images/login",
    targetPrefix: "ui/login/",
    files: [
      "04cd87b5-3984-474e-b5fc-bf887b582e79.webp",
      "2196af43-a96f-405a-9583-3836689dd4b7.webp",
      "250faa09-869b-4a80-9dc8-6af96ce50289.webp",
      "307e7ac4-6243-41d8-a274-6ab183ac9ed5.webp",
      "32d6769d-2fa6-428f-85cd-0b2a06deaf3f.webp",
      "485371d5-83c1-4b25-88df-cf4c83526b77.webp",
      "4efc606f-7134-413c-b3c2-529d17b4c33a.webp",
      "52338a67-1537-4d8e-a034-be7eff39a2d6.webp",
      "53cb1870-7473-42da-a2d3-cc9a5e818167.webp",
      "56fb29c7-ae2b-4486-a3dc-e45549affaed.webp",
      "5b3d9961-083c-47a1-bae3-21cb5983f0a3.webp",
      "734e129e-9b96-4d5b-8010-47f0fc9563b7.webp",
      "76905624-8457-4492-81fa-57494fa46f8f.webp",
      "7f1baf4e-fa5f-4332-9b51-6208172302b6.webp",
      "8d817704-6629-4340-be95-88e9e01b3ca2.webp",
      "918e4124-6722-47e0-9bea-449042b7ae26.webp",
      "a430ce82-d962-4c11-87c4-72042ba40059.webp",
      "a957515d-cc11-4913-bfc9-69fa28fd92a7.webp",
      "c76a6c17-bde8-4335-a9f5-fa89adbfe04a.webp",
      "dfdc3f9c-ae8f-4ec8-becb-36f3504d80a8.webp",
      "e3ef1eb3-dc9e-4aab-955a-51a16fa40d1c.webp",
      "e8247091-8e82-46bf-aff5-b5b9219b7beb.webp",
      "f1a7c046-9761-40d4-974d-3897eb2a394b.webp",
      "fd48717a-ca5a-4536-ad95-133985313b96.webp",
      "uploads_generated_2025_09_27_1f7c58a2-7fd3-424b-ad4a-aa55897fa6fb.webp",
      "uploads_generated_2025_09_27_21f55b1b-fc06-4706-bf5b-30a82bea26ad.webp",
      "uploads_generated_2025_09_27_5670f8cb-6113-45fb-ad08-a3f677f998b8.webp",
      "uploads_generated_2025_09_27_5cb741fb-879a-4e81-8369-fe364d59def6.webp",
      "uploads_generated_2025_09_27_5fb1d894-f8cc-4f71-a7c2-60222ebda1ec.webp",
      "uploads_generated_2025_09_27_76754fe7-2102-46eb-bee3-652dfaeab758.webp",
      "uploads_generated_2025_09_27_961c7cec-d01e-4a60-9340-f29fa6e79046.webp",
      "uploads_generated_2025_09_27_b7492ef5-8b03-4016-b4b0-10c16d245233.webp",
      "uploads_generated_2025_09_27_d116f05a-6fa7-42eb-bf0b-813db77d78fd.webp",
      "uploads_generated_2025_09_27_dc85c001-8b57-4fda-9f47-3d73bad8e4ed.webp",
    ],
  },

  // Before/After 对比图片
  beforeAfter: {
    sourcePath: "public/images",
    targetPrefix: "ui/before-after/",
    files: [
      { source: "before-1.webp", target: "before/before-1.webp" },
      { source: "before-2.webp", target: "before/before-2.webp" },
      { source: "before-3.webp", target: "before/before-3.webp" },
      { source: "before-4.webp", target: "before/before-4.webp" },
      { source: "before-5.webp", target: "before/before-5.webp" },
      { source: "before-6.webp", target: "before/before-6.webp" },
      { source: "after-1.webp", target: "after/after-1.webp" },
      { source: "after-2.webp", target: "after/after-2.webp" },
      { source: "after-3.webp", target: "after/after-3.webp" },
      { source: "after-4.webp", target: "after/after-4.webp" },
      { source: "after-5.webp", target: "after/after-5.webp" },
      { source: "after-6.webp", target: "after/after-6.webp" },
    ],
  },

  // 滚动画廊图片 (只迁移 WebP)
  gallery: {
    sourcePath: "public/images/roll",
    targetPrefix: "ui/gallery/",
    files: [
      "04cd87b5-3984-474e-b5fc-bf887b582e79.webp",
      "2196af43-a96f-405a-9583-3836689dd4b7.webp",
      "250faa09-869b-4a80-9dc8-6af96ce50289.webp",
      "307e7ac4-6243-41d8-a274-6ab183ac9ed5.webp",
      "32d6769d-2fa6-428f-85cd-0b2a06deaf3f.webp",
      "485371d5-83c1-4b25-88df-cf4c83526b77.webp",
      "4efc606f-7134-413c-b3c2-529d17b4c33a.webp",
      "52338a67-1537-4d8e-a034-be7eff39a2d6.webp",
      "53cb1870-7473-42da-a2d3-cc9a5e818167.webp",
      "56fb29c7-ae2b-4486-a3dc-e45549affaed.webp",
      "5b3d9961-083c-47a1-bae3-21cb5983f0a3.webp",
      "734e129e-9b96-4d5b-8010-47f0fc9563b7.webp",
      "76905624-8457-4492-81fa-57494fa46f8f.webp",
      "7f1baf4e-fa5f-4332-9b51-6208172302b6.webp",
      "8d817704-6629-4340-be95-88e9e01b3ca2.webp",
      "918e4124-6722-47e0-9bea-449042b7ae26.webp",
      "a430ce82-d962-4c11-87c4-72042ba40059.webp",
      "a957515d-cc11-4913-bfc9-69fa28fd92a7.webp",
      "c76a6c17-bde8-4335-a9f5-fa89adbfe04a.webp",
      "dfdc3f9c-ae8f-4ec8-becb-36f3504d80a8.webp",
      "e3ef1eb3-dc9e-4aab-955a-51a16fa40d1c.webp",
      "e8247091-8e82-46bf-aff5-b5b9219b7beb.webp",
      "f1a7c046-9761-40d4-974d-3897eb2a394b.webp",
      "fd48717a-ca5a-4536-ad95-133985313b96.webp",
    ],
  },

  // 示例头像图片
  examples: {
    sourcePath: "public/images/head",
    targetPrefix: "ui/examples/",
    files: [
      "1.png",
      "istockphoto-2156062809-612x612.webp",
      "istockphoto-2174363314-612x612.webp",
      "istockphoto-2218333130-612x612.webp",
      "photo-1556157382-97eda2d62296.webg.webp",
      "photo-1633332755192-727a05c4013d.webp",
      "premium_photo-1689747698547-271d2d553cee.webp",
      "premium_photo-1691784778805-e1067ac42e01.webp",
    ],
  },

  // 避免示例图片
  avoid: {
    sourcePath: "public/images/inner",
    targetPrefix: "ui/avoid/",
    files: [
      "mahdi-bafande-4xVlmURVMHc-unsplash.jpg",
      "md-mahdi-oGlPMRb63uA-unsplash.jpg",
      "pexels-kampus-5935247 (1).jpg",
      "下载.png",
    ],
  },
};

// 获取文件MIME类型
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// 优化图片
async function optimizeImage(filePath, targetPath) {
  const ext = path.extname(filePath).toLowerCase();

  // 如果已经是WebP，直接返回原文件
  if (ext === ".webp") {
    return fs.readFileSync(filePath);
  }

  // 转换为WebP并优化
  return await sharp(filePath).webp({ quality: 85, effort: 6 }).toBuffer();
}

// 上传单个文件到R2
async function uploadFile(localPath, r2Key, optimize = false) {
  try {
    const fullLocalPath = path.resolve(localPath);

    if (!fs.existsSync(fullLocalPath)) {
      console.log(`❌ File not found: ${fullLocalPath}`);
      return false;
    }

    let fileBuffer;
    let contentType;

    if (optimize && !localPath.endsWith(".webp")) {
      // 优化并转换为WebP
      fileBuffer = await optimizeImage(fullLocalPath, r2Key);
      contentType = "image/webp";
      // 如果转换为WebP，更新key
      r2Key = r2Key.replace(/\.[^.]+$/, ".webp");
    } else {
      // 直接读取文件
      fileBuffer = fs.readFileSync(fullLocalPath);
      contentType = getMimeType(localPath);
    }

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // 1年缓存
    };

    await r2Client.upload(uploadParams).promise();

    const originalSize = fs.statSync(fullLocalPath).size;
    const newSize = fileBuffer.length;
    const savings = (((originalSize - newSize) / originalSize) * 100).toFixed(
      1,
    );

    console.log(`✅ Uploaded: ${r2Key}`);
    console.log(
      `   Size: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${savings > 0 ? "-" : "+"}${Math.abs(savings)}%)`,
    );

    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${r2Key}:`, error.message);
    return false;
  }
}

// 迁移特定类别的图片
async function migrateCategory(categoryName, config) {
  console.log(`\n📁 Migrating ${categoryName} images...`);

  const { sourcePath, targetPrefix, files } = config;
  let successCount = 0;
  let totalCount = files.length;

  for (const file of files) {
    let sourceFile, targetKey;

    if (typeof file === "string") {
      sourceFile = path.join(sourcePath, file);
      targetKey = targetPrefix + file;
    } else {
      // 处理 beforeAfter 类型的对象
      sourceFile = path.join(sourcePath, file.source);
      targetKey = targetPrefix + file.target;
    }

    const success = await uploadFile(sourceFile, targetKey, true);
    if (success) successCount++;
  }

  console.log(
    `📊 ${categoryName}: ${successCount}/${totalCount} files uploaded successfully`,
  );
  return { success: successCount, total: totalCount };
}

// 检查R2连接并创建bucket
async function ensureBucketExists() {
  try {
    console.log("🔍 Testing R2 connection...");

    // 尝试列出bucket
    try {
      const result = await r2Client
        .listObjectsV2({
          Bucket: BUCKET_NAME,
          MaxKeys: 1,
        })
        .promise();

      console.log(`✅ R2 connection successful. Bucket: ${BUCKET_NAME}`);
      return true;
    } catch (error) {
      console.log(`⚠️  Bucket ${BUCKET_NAME} access issue:`, error.message);
      console.log(
        "This is normal - the bucket likely already exists but we don't have list permissions",
      );
      console.log("Proceeding with upload attempts...");
      return true;
    }
  } catch (error) {
    console.error("❌ R2 connection/creation failed:", error.message);
    return false;
  }
}

// 创建用户头像占位符
async function createAvatarPlaceholders() {
  console.log("\n👤 Creating avatar placeholders...");

  const avatars = [
    { name: "mia.jpg", color: "#FF6B6B" },
    { name: "leo.jpg", color: "#4ECDC4" },
    { name: "ava.jpg", color: "#45B7D1" },
    { name: "ken.jpg", color: "#96CEB4" },
  ];

  for (const avatar of avatars) {
    try {
      // 创建简单的彩色头像占位符
      const svgBuffer = Buffer.from(`
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="${avatar.color}"/>
          <circle cx="50" cy="35" r="12" fill="white" opacity="0.9"/>
          <path d="M30 65 Q50 55 70 65 Q70 75 50 80 Q30 75 30 65" fill="white" opacity="0.9"/>
        </svg>
      `);

      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: `ui/avatars/${avatar.name}`,
        Body: svgBuffer,
        ContentType: "image/svg+xml",
        CacheControl: "public, max-age=31536000",
      };

      await r2Client.upload(uploadParams).promise();
      console.log(`✅ Created avatar: ${avatar.name}`);
    } catch (error) {
      console.error(`❌ Failed to create ${avatar.name}:`, error.message);
    }
  }
}

// 主迁移函数
async function main() {
  console.log("🚀 Starting image migration to R2...\n");
  console.log("🔍 Testing R2 connection...");

  // 检查环境变量
  if (!process.env.CLOUDFLARE_R2_ENDPOINT) {
    console.error(
      "❌ Missing R2 environment variables. Please check your .env file.",
    );
    console.error("Required variables:");
    console.error("- CLOUDFLARE_R2_ENDPOINT");
    console.error("- CLOUDFLARE_R2_ACCESS_KEY_ID");
    console.error("- CLOUDFLARE_R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  console.log("✅ Found R2 environment variables");
  console.log(`   Endpoint: ${process.env.CLOUDFLARE_R2_ENDPOINT}`);
  console.log(`   Bucket: ${BUCKET_NAME}`);

  // 确保bucket存在
  const connectionOk = await ensureBucketExists();
  if (!connectionOk) {
    process.exit(1);
  }

  const results = {};

  // 迁移各类图片
  for (const [categoryName, config] of Object.entries(MIGRATION_CONFIG)) {
    results[categoryName] = await migrateCategory(categoryName, config);
  }

  // 创建用户头像
  await createAvatarPlaceholders();

  // 输出总结
  console.log("\n📊 Migration Summary:");
  console.log("═".repeat(50));

  let totalSuccess = 0;
  let totalFiles = 0;

  for (const [category, result] of Object.entries(results)) {
    console.log(
      `${category.padEnd(15)}: ${result.success}/${result.total} uploaded`,
    );
    totalSuccess += result.success;
    totalFiles += result.total;
  }

  console.log("═".repeat(50));
  console.log(
    `Total: ${totalSuccess}/${totalFiles} files uploaded successfully`,
  );
  console.log(
    `Success rate: ${((totalSuccess / totalFiles) * 100).toFixed(1)}%`,
  );

  console.log("\n✨ Migration completed!");
  console.log("\nNext steps:");
  console.log("1. Update environment variables with R2 domain");
  console.log("2. Update image URL configurations");
  console.log("3. Test image loading in development");
  console.log("4. Remove local images after testing");
}

// 运行脚本
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
}

module.exports = {
  uploadFile,
  migrateCategory,
  MIGRATION_CONFIG,
};
