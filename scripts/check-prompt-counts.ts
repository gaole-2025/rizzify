import fs from 'fs/promises';
import path from 'path';

async function checkPromptCounts() {
  const p2Path = path.resolve(process.cwd(), 'docs/catalog/prompt-catalog.full.p2.json');
  const p3Path = path.resolve(process.cwd(), 'docs/catalog/prompt-catalog.full.p3.json');

  const p2Data = JSON.parse(await fs.readFile(p2Path, 'utf-8'));
  const p3Data = JSON.parse(await fs.readFile(p3Path, 'utf-8'));

  const p2Items = p2Data.items || [];
  const p3Items = p3Data.items || [];

  console.log('📊 Prompt Catalog Statistics\n');
  
  console.log('P2 Prompts:');
  console.log(`  Total: ${p2Items.length}`);
  console.log(`  Male: ${p2Items.filter((i: any) => i.gender === 'male').length}`);
  console.log(`  Female: ${p2Items.filter((i: any) => i.gender === 'female').length}`);
  console.log(`  Unisex: ${p2Items.filter((i: any) => i.gender === 'unisex').length}`);
  
  console.log('\nP3 Prompts:');
  console.log(`  Total: ${p3Items.length}`);
  console.log(`  Male: ${p3Items.filter((i: any) => i.gender === 'male').length}`);
  console.log(`  Female: ${p3Items.filter((i: any) => i.gender === 'female').length}`);
  console.log(`  Unisex: ${p3Items.filter((i: any) => i.gender === 'unisex').length}`);

  console.log('\n🎯 Pro Plan Requirements (70 images):');
  console.log('  P2 needed: 35');
  console.log('  P3 needed: 35');

  const maleP2 = p2Items.filter((i: any) => i.gender === 'male').length;
  const maleP3 = p3Items.filter((i: any) => i.gender === 'male').length;
  const maleP2Unisex = maleP2 + p2Items.filter((i: any) => i.gender === 'unisex').length;
  const maleP3Unisex = maleP3 + p3Items.filter((i: any) => i.gender === 'unisex').length;

  console.log('\n👨 Male (gender-specific + unisex):');
  console.log(`  P2 available: ${maleP2Unisex} (male: ${maleP2}, unisex: ${p2Items.filter((i: any) => i.gender === 'unisex').length})`);
  console.log(`  P3 available: ${maleP3Unisex} (male: ${maleP3}, unisex: ${p3Items.filter((i: any) => i.gender === 'unisex').length})`);
  console.log(`  P2 shortage: ${Math.max(0, 35 - maleP2Unisex)}`);
  console.log(`  P3 shortage: ${Math.max(0, 35 - maleP3Unisex)}`);

  const femaleP2 = p2Items.filter((i: any) => i.gender === 'female').length;
  const femaleP3 = p3Items.filter((i: any) => i.gender === 'female').length;
  const femaleP2Unisex = femaleP2 + p2Items.filter((i: any) => i.gender === 'unisex').length;
  const femaleP3Unisex = femaleP3 + p3Items.filter((i: any) => i.gender === 'unisex').length;

  console.log('\n👩 Female (gender-specific + unisex):');
  console.log(`  P2 available: ${femaleP2Unisex} (female: ${femaleP2}, unisex: ${p2Items.filter((i: any) => i.gender === 'unisex').length})`);
  console.log(`  P3 available: ${femaleP3Unisex} (female: ${femaleP3}, unisex: ${p3Items.filter((i: any) => i.gender === 'unisex').length})`);
  console.log(`  P2 shortage: ${Math.max(0, 35 - femaleP2Unisex)}`);
  console.log(`  P3 shortage: ${Math.max(0, 35 - femaleP3Unisex)}`);

  // Check for duplicates
  if (maleP2Unisex < 35 || maleP3Unisex < 35 || femaleP2Unisex < 35 || femaleP3Unisex < 35) {
    console.log('\n⚠️  WARNING: Not enough unique prompts!');
    console.log('   This will cause duplicate images in Pro plan.');
    console.log('   Solution: Enable prompt reuse with variation.');
  }
}

checkPromptCounts().catch(console.error);
