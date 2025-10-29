import fs from 'fs/promises';
import path from 'path';

async function exportDuplicates() {
  const p2Path = path.resolve(process.cwd(), 'docs/catalog/prompt-catalog.full.p2.json');
  const p3Path = path.resolve(process.cwd(), 'docs/catalog/prompt-catalog.full.p3.json');

  const p2Data = JSON.parse(await fs.readFile(p2Path, 'utf-8'));
  const p3Data = JSON.parse(await fs.readFile(p3Path, 'utf-8'));

  const allPrompts = [...p2Data.items, ...p3Data.items];

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
  const duplicates: any[] = [];
  groups.forEach((items, prefix) => {
    if (items.length > 1) {
      duplicates.push({
        prefix,
        count: items.length,
        items: items.map(item => ({
          id: item.id,
          source: item.source,
          gender: item.gender,
          text: item.text
        }))
      });
    }
  });

  // Export to markdown
  let markdown = '# 提示词重复分析报告\n\n';
  markdown += `**总计**: 找到 ${duplicates.length} 组重复的提示词\n\n`;
  markdown += `**影响**: 这些提示词的前 50 个字符完全相同，会导致 AI 生成非常相似的图片\n\n`;
  markdown += '---\n\n';

  duplicates.forEach((dup, idx) => {
    markdown += `## 重复组 ${idx + 1}: ${dup.count} 个提示词\n\n`;
    markdown += `**前 50 字**: "${dup.prefix}..."\n\n`;
    
    dup.items.forEach((item: any, i: number) => {
      markdown += `### ${i + 1}. ${item.id} (${item.source}, ${item.gender})\n\n`;
      markdown += '```\n';
      markdown += item.text;
      markdown += '\n```\n\n';
    });
    
    markdown += '---\n\n';
  });

  // Save to file
  const outputPath = path.resolve(process.cwd(), 'docs/DUPLICATE_PROMPTS_REPORT.md');
  await fs.writeFile(outputPath, markdown, 'utf-8');
  
  console.log(`✅ 报告已保存到: ${outputPath}`);
  console.log(`\n📊 统计:`);
  console.log(`   - 总提示词数: ${allPrompts.length}`);
  console.log(`   - 重复组数: ${duplicates.length}`);
  console.log(`   - 涉及提示词数: ${duplicates.reduce((sum, d) => sum + d.count, 0)}`);
  console.log(`   - 重复率: ${(duplicates.reduce((sum, d) => sum + d.count, 0) / allPrompts.length * 100).toFixed(1)}%`);
}

exportDuplicates().catch(console.error);
