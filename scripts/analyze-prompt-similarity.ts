import { promptSampler } from '../src/lib/prompt-sampler';

async function analyzeSimilarity() {
  console.log('🔍 Analyzing Prompt Similarity for Pro Plan\n');

  const maleSample = await promptSampler.sample('male', 'pro');
  
  console.log(`Total prompts: ${maleSample.count}\n`);
  console.log('First 10 prompts:\n');
  
  maleSample.prompts.slice(0, 10).forEach((p, i) => {
    console.log(`${i + 1}. [${p.source}] [${p.gender}] ${p.id}`);
    console.log(`   ${p.text.substring(0, 150)}...`);
    console.log('');
  });

  // Check for very similar prompts
  console.log('\n🔍 Checking for similar prompts (first 50 chars):\n');
  const prefixes = new Map<string, number>();
  
  maleSample.prompts.forEach((p) => {
    const prefix = p.text.substring(0, 50);
    prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
  });

  let similarCount = 0;
  prefixes.forEach((count, prefix) => {
    if (count > 1) {
      similarCount++;
      console.log(`⚠️  ${count} prompts start with: "${prefix}..."`);
    }
  });

  if (similarCount === 0) {
    console.log('✅ No similar prompt prefixes found');
  } else {
    console.log(`\n⚠️  Found ${similarCount} groups of similar prompts`);
    console.log('   This might cause similar-looking images');
  }

  // Check keyword frequency
  console.log('\n📊 Keyword Frequency Analysis:\n');
  const keywords = ['咖啡馆', '街头', '商务', '肖像', '户外', '室内', '夜景', '阳光'];
  keywords.forEach(keyword => {
    const count = maleSample.prompts.filter(p => p.text.includes(keyword)).length;
    if (count > 0) {
      console.log(`  "${keyword}": ${count} times (${(count / maleSample.count * 100).toFixed(1)}%)`);
    }
  });
}

analyzeSimilarity().catch(console.error);
