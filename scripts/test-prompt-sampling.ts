import { promptSampler } from '../src/lib/prompt-sampler';

async function testSampling() {
  console.log('🧪 Testing Prompt Sampling for Pro Plan (70 images)\n');

  // Test male sampling
  console.log('👨 Testing Male Gender:');
  const maleSample = await promptSampler.sample('male', 'pro');
  console.log(`  Total prompts: ${maleSample.count}`);
  
  // Check for duplicates
  const malePromptTexts = maleSample.prompts.map(p => p.text);
  const maleUniqueTexts = new Set(malePromptTexts);
  const maleDuplicates = malePromptTexts.length - maleUniqueTexts.size;
  
  console.log(`  Unique prompts: ${maleUniqueTexts.size}`);
  console.log(`  Duplicates: ${maleDuplicates}`);
  
  if (maleDuplicates > 0) {
    console.log('\n  ⚠️  FOUND DUPLICATES! Checking which ones...');
    const textCounts = new Map<string, number>();
    malePromptTexts.forEach(text => {
      textCounts.set(text, (textCounts.get(text) || 0) + 1);
    });
    
    let duplicateCount = 0;
    textCounts.forEach((count, text) => {
      if (count > 1) {
        duplicateCount++;
        console.log(`\n  Duplicate ${duplicateCount} (appears ${count} times):`);
        console.log(`    ${text.substring(0, 100)}...`);
      }
    });
  }

  // Check source distribution
  const maleP2Count = maleSample.prompts.filter(p => p.source === 'p2').length;
  const maleP3Count = maleSample.prompts.filter(p => p.source === 'p3').length;
  console.log(`\n  P2 prompts: ${maleP2Count}`);
  console.log(`  P3 prompts: ${maleP3Count}`);

  // Check gender distribution
  const maleMale = maleSample.prompts.filter(p => p.gender === 'male').length;
  const maleUnisex = maleSample.prompts.filter(p => p.gender === 'unisex').length;
  console.log(`\n  Male-specific: ${maleMale}`);
  console.log(`  Unisex: ${maleUnisex}`);

  console.log('\n' + '='.repeat(60) + '\n');

  // Test female sampling
  console.log('👩 Testing Female Gender:');
  const femaleSample = await promptSampler.sample('female', 'pro');
  console.log(`  Total prompts: ${femaleSample.count}`);
  
  const femalePromptTexts = femaleSample.prompts.map(p => p.text);
  const femaleUniqueTexts = new Set(femalePromptTexts);
  const femaleDuplicates = femalePromptTexts.length - femaleUniqueTexts.size;
  
  console.log(`  Unique prompts: ${femaleUniqueTexts.size}`);
  console.log(`  Duplicates: ${femaleDuplicates}`);

  if (femaleDuplicates > 0) {
    console.log('\n  ⚠️  FOUND DUPLICATES!');
  }

  const femaleP2Count = femaleSample.prompts.filter(p => p.source === 'p2').length;
  const femaleP3Count = femaleSample.prompts.filter(p => p.source === 'p3').length;
  console.log(`\n  P2 prompts: ${femaleP2Count}`);
  console.log(`  P3 prompts: ${femaleP3Count}`);

  console.log('\n' + '='.repeat(60));
  
  if (maleDuplicates > 0 || femaleDuplicates > 0) {
    console.log('\n❌ PROBLEM CONFIRMED: Duplicate prompts detected!');
    console.log('   This explains why you see identical images.');
  } else {
    console.log('\n✅ No duplicates found in sampling logic.');
    console.log('   The problem might be elsewhere.');
  }
}

testSampling().catch(console.error);
