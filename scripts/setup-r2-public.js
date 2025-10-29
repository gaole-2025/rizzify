require("dotenv").config();
const AWS = require("aws-sdk");

// R2 配置
const r2Client = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  region: "auto",
  signatureVersion: "v4",
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_TEMPLATES_BUCKET || "rizzify";

// 设置 bucket 为公开读取
async function setupPublicAccess() {
  console.log("🔧 Setting up R2 bucket for public access...");
  console.log(`📦 Bucket: ${BUCKET_NAME}`);

  try {
    // 创建公开读取的 bucket 策略
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    };

    // 应用 bucket 策略
    console.log("📋 Applying public read policy...");
    await r2Client.putBucketPolicy({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    }).promise();

    console.log("✅ Public read policy applied successfully!");

    // 测试访问
    console.log("🔍 Testing public access...");
    const testKey = "ui/login/04cd87b5-3984-474e-b5fc-bf887b582e79.webp";
    const publicUrl = `https://pub-${process.env.CLOUDFLARE_R2_ENDPOINT.match(/https:\/\/(.+?)\.r2\./)[1]}.r2.dev/${testKey}`;

    console.log("🌐 Public URL format:", publicUrl);
    console.log("📸 Test accessing this URL in your browser to verify it works");

    // 显示 CORS 设置说明
    console.log("\n📝 Next steps:");
    console.log("1. The bucket is now publicly accessible");
    console.log("2. If you encounter CORS issues, you may need to configure CORS in Cloudflare dashboard");
    console.log("3. Test the image URLs in your application");

    console.log("\n🔧 CORS configuration (if needed):");
    console.log("Add this to your R2 bucket CORS settings:");
    console.log(JSON.stringify([
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3600
      }
    ], null, 2));

  } catch (error) {
    console.error("❌ Failed to setup public access:", error.message);

    if (error.message.includes("Access Denied")) {
      console.log("\n💡 Alternative approach:");
      console.log("1. Go to Cloudflare dashboard > R2 > Your bucket");
      console.log("2. Click on 'Settings' tab");
      console.log("3. Enable 'Public access' and configure domain");
      console.log("4. Or use Cloudflare Workers/Pages for serving images");
    }
  }
}

// 检查当前 bucket 策略
async function checkBucketPolicy() {
  try {
    console.log("🔍 Checking current bucket policy...");
    const policy = await r2Client.getBucketPolicy({
      Bucket: BUCKET_NAME
    }).promise();

    console.log("📋 Current policy:");
    console.log(JSON.parse(policy.Policy));
  } catch (error) {
    if (error.code === 'NoSuchBucketPolicy') {
      console.log("ℹ️  No bucket policy currently exists");
    } else {
      console.log("⚠️  Could not retrieve bucket policy:", error.message);
    }
  }
}

// 主函数
async function main() {
  console.log("🚀 R2 Public Access Setup");
  console.log("========================\n");

  // 检查环境变量
  if (!process.env.CLOUDFLARE_R2_ENDPOINT) {
    console.error("❌ Missing R2 environment variables");
    process.exit(1);
  }

  await checkBucketPolicy();
  await setupPublicAccess();
}

if (require.main === module) {
  main().catch(error => {
    console.error("💥 Setup failed:", error);
    process.exit(1);
  });
}

module.exports = {
  setupPublicAccess,
  checkBucketPolicy
};
