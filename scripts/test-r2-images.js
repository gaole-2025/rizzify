require("dotenv").config();
const https = require("https");

// 测试图片URLs
const testImages = [
  {
    name: "Login Background",
    url: "https://rizzify.org/ui/login/04cd87b5-3984-474e-b5fc-bf887b582e79.webp",
  },
  {
    name: "Before Image",
    url: "https://rizzify.org/ui/before-after/before/before-1.webp",
  },
  {
    name: "After Image",
    url: "https://rizzify.org/ui/before-after/after/after-1.webp",
  },
  {
    name: "Gallery Image",
    url: "https://rizzify.org/ui/gallery/2196af43-a96f-405a-9583-3836689dd4b7.webp",
  },
  {
    name: "Example Image",
    url: "https://rizzify.org/ui/examples/1.webp",
  },
  {
    name: "Avoid Image",
    url: "https://rizzify.org/ui/avoid/mahdi-bafande-4xVlmURVMHc-unsplash.webp",
  },
  {
    name: "Avatar Image",
    url: "https://rizzify.org/ui/avatars/mia.jpg",
  },
];

// 测试单个图片URL
function testImageUrl(imageInfo) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = https.get(imageInfo.url, (res) => {
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      let status = "✅";
      let message = `${res.statusCode} ${res.statusMessage}`;

      if (res.statusCode !== 200) {
        status = "❌";
        if (res.statusCode === 401) {
          message = "401 Unauthorized - Bucket not public";
        } else if (res.statusCode === 404) {
          message = "404 Not Found - Image missing";
        }
      }

      console.log(`${status} ${imageInfo.name}`);
      console.log(`   ${message} (${loadTime}ms)`);
      console.log(`   ${imageInfo.url}\n`);

      resolve({
        name: imageInfo.name,
        url: imageInfo.url,
        status: res.statusCode,
        success: res.statusCode === 200,
        loadTime,
      });

      req.destroy();
    });

    req.on("error", (error) => {
      console.log(`❌ ${imageInfo.name}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   ${imageInfo.url}\n`);

      resolve({
        name: imageInfo.name,
        url: imageInfo.url,
        status: 0,
        success: false,
        error: error.message,
      });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${imageInfo.name}`);
      console.log(`   Timeout after 10 seconds`);
      console.log(`   ${imageInfo.url}\n`);

      req.destroy();
      resolve({
        name: imageInfo.name,
        url: imageInfo.url,
        status: 0,
        success: false,
        error: "Timeout",
      });
    });
  });
}

// 主测试函数
async function testAllImages() {
  console.log("🚀 Testing R2 Image Access");
  console.log("=========================\n");

  console.log("📋 Environment Configuration:");
  console.log(`   USE_R2_IMAGES: ${process.env.USE_R2_IMAGES || "false"}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`   R2 Domain: https://rizzify.org\n`);

  console.log("🔍 Testing Image URLs:\n");

  const results = [];

  // 测试所有图片
  for (const imageInfo of testImages) {
    const result = await testImageUrl(imageInfo);
    results.push(result);

    // 添加小延迟避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 生成总结报告
  console.log("📊 Test Results Summary:");
  console.log("========================\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const avgLoadTime =
      successful.reduce((sum, r) => sum + (r.loadTime || 0), 0) /
      successful.length;
    console.log(`⚡ Average load time: ${Math.round(avgLoadTime)}ms`);
  }

  if (failed.length > 0) {
    console.log("\n❌ Failed Images:");
    failed.forEach((result) => {
      console.log(
        `   - ${result.name}: ${result.error || `HTTP ${result.status}`}`,
      );
    });

    console.log("\n💡 Next Steps:");
    if (failed.some((r) => r.status === 401)) {
      console.log("   1. Go to Cloudflare Dashboard > R2 > rizzify bucket");
      console.log("   2. Click 'Settings' tab");
      console.log("   3. Enable 'Public access' under 'R2.dev subdomain'");
      console.log("   4. Wait a few minutes for changes to propagate");
    }
    if (failed.some((r) => r.status === 404)) {
      console.log("   • Some images may not have been uploaded correctly");
      console.log("   • Re-run the migration script: npm run migrate-images");
    }
  } else {
    console.log("\n🎉 All images are accessible!");
    console.log("   You can now use R2 images in your application");
    console.log("   Set USE_R2_IMAGES=true in your .env.local file");
  }

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    results,
  };
}

// 运行测试
if (require.main === module) {
  testAllImages()
    .then((summary) => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error);
      process.exit(1);
    });
}

module.exports = {
  testAllImages,
  testImageUrl,
  testImages,
};
