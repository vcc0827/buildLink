import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('生成简化后的合同导入模板...\n');

  // 获取所有对账单位
  const reconciliationUnits = await prisma.reconciliationUnit.findMany({
    orderBy: { id: 'asc' }
  });

  console.log('=== 对账单位列表（签约方） ===');
  console.log('ID\t公司名称');
  reconciliationUnits.forEach(unit => {
    console.log(`${unit.id}\t${unit.companyName}`);
  });

  console.log('\n\n=== 产品列表 ===');
  const products = await prisma.product.findMany({
    orderBy: [{ name: 'asc' }, { model: 'asc' }],
  });

  console.log('产品ID\t产品名称\t型号\t单位\t价格');
  products.forEach(p => {
    console.log(`${p.id}\t${p.name}\t${p.model || '-'}\t${p.unit}\t${p.price || 0}`);
  });

  console.log('\n\n=== 合同主表（Contract）模板 ===');
  console.log('合同编号\t合同名称\t签约方ID\t项目名称\t签订日期\t状态\t备注');
  reconciliationUnits.slice(0, 5).forEach((unit, index) => {
    const no = `HT2024${String(index + 1).padStart(3, '0')}`;
    const name = `${unit.projectName || unit.companyName}供货合同`;
    console.log(`${no}\t${name}\t${unit.id}\t${unit.projectName || ''}\t2024-01-01\tactive\t`);
  });
  console.log('（请根据实际情况填写完整）');

  console.log('\n\n=== 合同产品明细（ContractItem）模板 ===');
  console.log('合同编号\t产品ID\t产品名称\t计量单位\t单价');

  // 为简化后的产品生成模板
  products.slice(0, 5).forEach(p => {
    const fullName = `${p.name}${p.model ? '-' + p.model : ''}`;
    console.log(`HT2024001\t${p.id}\t${fullName}\t${p.unit}\t${p.price || 0}`);
  });
  console.log('（请根据实际合同内容填写）');

  console.log('\n\n✅ 模板生成完成！');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});