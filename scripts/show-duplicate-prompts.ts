import fs from 'fs/promises';
import path from 'path';

async function showDuplicates() {
  const p2Path = path.resolve(process.cwd(), 'docs/catalog/prompt-catalog.full.p2.json');
  const p3Path = path.resolve(process.cwd(), 'docs/catalog/prompt-catalog.full.p3.json');

  const p2Data = JSON.parse(await fs.readFile(p2Path, 'utf-8'));
  const p3Data = JSON.parse(await fs.readFile(p3Path, 'utf-8'));

  const allPrompts = [...p2Data.items, ...p3Data.items];

  console.log('🔍 查找前 50 个字符相同的提示词\n');
  console.log('='.repeat(80) + '\n');

  // Group by first 50 characters
  const groups = new Map<string, any[]>();
  
  allPrompts.forEach((item: any) => {
    const prefix = item.text.substring(0, 50);
    if (!groups.has(prefix)) {
      groups.set(prefix, []);
    }
    groups.get(prefix)!.push(item);
  });

  // Find duplicates
  let duplicateGroupCount = 0;
  groups.forEach((items, prefix) => {
    if (items.length > 1) {
      duplicateGroupCount++;
      console.log(`📋 重复组 ${duplicateGroupCount}: ${items.length} 个提示词`);
      console.log(`前 50 字: "${prefix}..."\n`);
      
      items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ID: ${item.id} | Source: ${item.source} | Gender: ${item.gender}`);
        console.log(`     完整提示词: ${item.text.substring(0, 200)}...`);
        console.log('');
      });
      
      console.log('-'.repeat(80) + '\n');
    }
  });

  console.log(`\n✅ 总共找到 ${duplicateGroupCount} 组重复的提示词`);
  console.log(`   这些提示词的前 50 个字符完全相同，可能导致生成相似的图片\n`);
}

showDuplicates().catch(console.error);
