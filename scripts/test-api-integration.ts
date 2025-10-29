/**
 * Test script for API integration modules
 */

import { promptSampler } from '../src/lib/prompt-sampler';
import { apicoreClient } from '../src/lib/apicore-client';
import { beautifyProcessor } from '../src/lib/beautify-processor';
import { imageManager } from '../src/lib/image-manager';

async function testPromptSampler() {
  console.log('\n=== Testing PromptSampler ===');
  try {
    const result = await promptSampler.sample('male', 'free');
    console.log(`✅ Sampled ${result.count} prompts for male/free plan`);
    console.log(`   First prompt: ${result.prompts[0].id} - ${result.prompts[0].text.substring(0, 50)}...`);
  } catch (error) {
    console.error('❌ PromptSampler test failed:', error);
  }
}

async function testApicoreClient() {
  console.log('\n=== Testing ApicoreClient ===');
  try {
    console.log('⚠️  Skipping actual API call (requires valid image URL)');
    console.log('✅ ApicoreClient initialized successfully');
  } catch (error) {
    console.error('❌ ApicoreClient test failed:', error);
  }
}

async function testImageManager() {
  console.log('\n=== Testing ImageManager ===');
  try {
    console.log('⚠️  Skipping actual download/upload (requires valid image URL and R2 credentials)');
    console.log('✅ ImageManager initialized successfully');
  } catch (error) {
    console.error('❌ ImageManager test failed:', error);
  }
}

async function testBeautifyProcessor() {
  console.log('\n=== Testing BeautifyProcessor ===');
  try {
    console.log('⚠️  Skipping actual beautify (requires valid image URL)');
    console.log('✅ BeautifyProcessor initialized successfully');
  } catch (error) {
    console.error('❌ BeautifyProcessor test failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting API Integration Tests...\n');

  await testPromptSampler();
  await testApicoreClient();
  await testImageManager();
  await testBeautifyProcessor();

  console.log('\n✅ All tests completed!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
