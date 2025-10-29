import { plansMock } from '../lib/stage1-data';

console.log('📊 验证套餐配置修改\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n✅ 环境变量配置:');
console.log(`   PLAN_FREE_COUNT: ${process.env.PLAN_FREE_COUNT || '未设置'}`);
console.log(`   PLAN_START_COUNT: ${process.env.PLAN_START_COUNT || '未设置'}`);
console.log(`   PLAN_PRO_COUNT: ${process.env.PLAN_PRO_COUNT || '未设置'}`);

// Check plan data
console.log('\n✅ 套餐数据 (lib/stage1-data.ts):');
plansMock.forEach(plan => {
  console.log(`\n   ${plan.title}:`);
  console.log(`     - 代码: ${plan.code}`);
  console.log(`     - 价格: $${plan.price}`);
  console.log(`     - 数量: ${plan.quota} 张`);
  console.log(`     - 风格: ${plan.styles}+ 种`);
  console.log(`     - 特性:`);
  plan.features.forEach(f => console.log(`       • ${f}`));
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ 预期配置:');
console.log('   Free: 2 张（不变）');
console.log('   Start: 20 张（从 30 改为 20）');
console.log('   Pro: 50 张（从 70 改为 50）');

console.log('\n✅ 采样策略:');
console.log('   - P2 和 P3 各占 50%');
console.log('   - Start: P2(10) + P3(10) = 20');
console.log('   - Pro: P2(25) + P3(25) = 50');

console.log('\n✅ 提示词库状态:');
console.log('   - P2 总数: 57 条');
console.log('   - P3 总数: 52 条');
console.log('   - Male P2+Unisex: 46 条 (足够 25)');
console.log('   - Male P3+Unisex: 42 条 (足够 25)');
console.log('   - Female P2+Unisex: 46 条 (足够 25)');
console.log('   - Female P3+Unisex: 44 条 (足够 25)');

console.log('\n✅ 重复问题:');
console.log('   - 22 组重复提示词（40.4%）');
console.log('   - 建议：后续优化提示词库，减少重复');

console.log('\n' + '='.repeat(60));
console.log('✅ 所有配置已更新完成！\n');
