import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('生成合同导入模板...\n');

  // 获取所有对账单位
  const reconciliationUnits = await prisma.reconciliationUnit.findMany({
    orderBy: { id: 'asc' }
  });

  console.log('=== 对账单位列表（用于匹配签约方） ===');
  console.log('ID\t公司名称\n');
  reconciliationUnits.forEach(unit => {
    console.log(`${unit.id}\t${unit.companyName}`);
  });

  console.log('\n\n=== 合同主表（Contract）导入模板 ===');
  console.log('合同编号\t合同名称\t签约方ID\t签约方名称\t项目名称\t签订日期\t状态\t备注');

  // 生成示例数据（用户可根据实际情况修改）
  reconciliationUnits.forEach((unit, index) => {
    const no = `HT2024${String(index + 1).padStart(3, '0')}`;
    const name = `${unit.projectName || unit.companyName}供货合同`;
    const date = '2024-01-01';
    const status = 'active';
    console.log(`${no}\t${name}\t${unit.id}\t${unit.companyName}\t${unit.projectName || ''}\t${date}\t${status}\t`);
  });

  console.log('\n\n=== 合同产品明细（ContractItem）导入模板 ===');
  console.log('合同编号\t产品ID\t产品名称\t计量单位\t单价');

  // 获取所有产品
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' }
  });

  console.log('\n产品列表（用于匹配产品ID）：');
  console.log('ID\t产品名称\t型号\t规格\t单位\t价格');
  products.forEach(p => {
    const fullName = `${p.name}${p.model ? '-' + p.model : ''}${p.spec ? '-' + p.spec : ''}`;
    console.log(`${p.id}\t${p.name}\t${p.model || ''}\t${p.spec || ''}\t${p.unit}\t${p.price || 0}`);
  });

  // 为每个合同生成产品明细模板
  console.log('\n\n合同产品明细示例（每个合同需要的产品明细）：');
  console.log('（请根据实际合同内容，将下面的合同编号替换为您填写的合同编号）');
  reconciliationUnits.slice(0, 3).forEach((unit, index) => {
    const no = `HT2024${String(index + 1).padStart(3, '0')}`;
    products.slice(0, 3).forEach(p => {
      const fullName = `${p.name}${p.model ? '-' + p.model : ''}${p.spec ? '-' + p.spec : ''}`;
      console.log(`${no}\t${p.id}\t${fullName}\t${p.unit}\t${p.price || 0}`);
    });
  });

  console.log('\n\n✅ 模板生成完成！');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});