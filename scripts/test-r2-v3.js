/**
 * 使用AWS SDK v3测试Cloudflare R2连接和上传功能
 */

require('dotenv').config({ path: '.env' });
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// 手动读取.env文件以确保配置加载
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const getConfig = (key) => {
  const match = envContent.split('\n').find(line => line.startsWith(`${key}=`));
  return match?.split('=')[1];
};

const endpoint = getConfig('CLOUDFLARE_R2_ENDPOINT');
const accessKeyId = getConfig('CLOUDFLARE_R2_ACCESS_KEY_ID');
const secretAccessKey = getConfig('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
const templatesBucket = getConfig('CLOUDFLARE_R2_TEMPLATES_BUCKET');

console.log('🔧 Testing Cloudflare R2 connection with AWS SDK v3...');

if (!endpoint || !accessKeyId || !secretAccessKey || !templatesBucket) {
  console.error('❌ Missing R2 configuration. Please check your .env file.');
  process.exit(1);
}

console.log('📡 R2 Configuration:');
console.log(`  Endpoint: ${endpoint}`);
console.log(`  Bucket: ${templatesBucket}`);

// 创建R2客户端 (AWS SDK v3)
const r2Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

async function testR2Connection() {
  try {
    console.log('\n📋 Testing bucket access...');

    // 列出bucket内容
    const listCommand = new ListObjectsV2Command({
      Bucket: templatesBucket,
      MaxKeys: 10
    });

    const listResult = await r2Client.send(listCommand);

    console.log(`✅ Bucket "${templatesBucket}" is accessible`);
    console.log(`📁 Current objects in bucket: ${listResult.Contents?.length || 0}`);

    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log('\n📄 Existing objects:');
      listResult.Contents.forEach(obj => {
        console.log(`  - ${obj.Key} (${obj.Size} bytes, ${obj.LastModified})`);
      });
    }

    // 测试上传一个小的测试文件
    console.log('\n📤 Testing file upload...');
    const testKey = 'test-connection-v3.txt';
    const testContent = 'R2 connection test with AWS SDK v3 - ' + new Date().toISOString();

    const uploadCommand = new PutObjectCommand({
      Bucket: templatesBucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    });

    await r2Client.send(uploadCommand);
    console.log(`✅ Successfully uploaded test file: ${testKey}`);

    // 测试下载
    console.log('\n📥 Testing file download...');
    const downloadCommand = new GetObjectCommand({
      Bucket: templatesBucket,
      Key: testKey
    });

    const downloadResult = await r2Client.send(downloadCommand);
    const chunks = [];
    for await (const chunk of downloadResult.Body) {
      chunks.push(chunk);
    }
    const downloadedContent = Buffer.concat(chunks).toString();

    if (downloadedContent === testContent) {
      console.log('✅ Successfully downloaded and verified test file');
    } else {
      console.error('❌ Downloaded content does not match uploaded content');
    }

    // 清理测试文件
    console.log('\n🗑️  Cleaning up test file...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: templatesBucket,
      Key: testKey
    });

    await r2Client.send(deleteCommand);
    console.log('✅ Test file deleted');

    console.log('\n🎉 R2 connection test completed successfully!');
    console.log('✅ All R2 operations are working correctly with AWS SDK v3');

    return true;

  } catch (error) {
    console.error('\n❌ R2 connection test failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    if (error.name === 'NoSuchBucket') {
      console.error('\n💡 Suggestion: The bucket may not exist. Please create it in your Cloudflare R2 dashboard.');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('\n💡 Suggestion: Check your R2 access key ID in the .env file.');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('\n💡 Suggestion: Check your R2 secret access key in the .env file.');
    } else if (error.$metadata?.httpStatusCode === 403) {
      console.error('\n💡 Suggestion: Check your R2 credentials and bucket permissions.');
    }

    return false;
  }
}

testR2Connection().then(success => {
  if (success) {
    console.log('\n🚀 R2 is ready for template upload!');
    console.log('Now you can run: node scripts/upload-templates-r2.js');
  } else {
    console.log('\n❌ Please fix R2 configuration before proceeding.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});