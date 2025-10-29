/**
 * 测试Cloudflare R2连接和上传功能
 */

require('dotenv').config({ path: '.env' });
const AWS = require('aws-sdk');

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

console.log('🔧 Testing Cloudflare R2 connection...');

if (!endpoint || !accessKeyId || !secretAccessKey || !templatesBucket) {
  console.error('❌ Missing R2 configuration. Please check your .env file.');
  process.exit(1);
}

console.log('📡 R2 Configuration:');
console.log(`  Endpoint: ${endpoint}`);
console.log(`  Bucket: ${templatesBucket}`);

// 创建R2客户端
const r2Client = new AWS.S3({
  endpoint,
  accessKeyId,
  secretAccessKey,
  region: 'us-east-1', // 尝试使用标准区域而不是auto
  signatureVersion: 'v4',
  s3ForcePathStyle: true, // 强制使用路径样式
  apiVersion: '2006-03-01',
});

async function testR2Connection() {
  try {
    console.log('\n📋 Testing bucket access...');

    // 列出bucket内容
    const listResult = await r2Client.listObjectsV2({
      Bucket: templatesBucket,
      MaxKeys: 10
    }).promise();

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
    const testKey = 'test-connection.txt';
    const testContent = 'R2 connection test - ' + new Date().toISOString();

    await r2Client.upload({
      Bucket: templatesBucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    }).promise();

    console.log(`✅ Successfully uploaded test file: ${testKey}`);

    // 测试下载
    console.log('\n📥 Testing file download...');
    const downloadResult = await r2Client.getObject({
      Bucket: templatesBucket,
      Key: testKey
    }).promise();

    const downloadedContent = downloadResult.Body.toString();
    if (downloadedContent === testContent) {
      console.log('✅ Successfully downloaded and verified test file');
    } else {
      console.error('❌ Downloaded content does not match uploaded content');
    }

    // 清理测试文件
    console.log('\n🗑️  Cleaning up test file...');
    await r2Client.deleteObject({
      Bucket: templatesBucket,
      Key: testKey
    }).promise();

    console.log('✅ Test file deleted');

    console.log('\n🎉 R2 connection test completed successfully!');
    console.log('✅ All R2 operations are working correctly');

    return true;

  } catch (error) {
    console.error('\n❌ R2 connection test failed:', error);
    console.error('Error details:', error.message);

    if (error.code === 'NoSuchBucket') {
      console.error('\n💡 Suggestion: The bucket may not exist. Please create it in your Cloudflare R2 dashboard.');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.error('\n💡 Suggestion: Check your R2 access key ID in the .env file.');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('\n💡 Suggestion: Check your R2 secret access key in the .env file.');
    }

    return false;
  }
}

testR2Connection().then(success => {
  if (success) {
    console.log('\n🚀 R2 is ready for template upload!');
  } else {
    console.log('\n❌ Please fix R2 configuration before proceeding.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});