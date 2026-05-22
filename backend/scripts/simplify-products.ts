import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始简化产品数据...\n');

  // 删除所有蒸压加气混凝土砌块
  const deletedBlocks = await prisma.product.deleteMany({
    where: { name: '蒸压加气混凝土砌块' },
  });
  console.log(`已删除蒸压加气混凝土砌块: ${deletedBlocks.count}条`);

  // 重新插入简化的加气块产品（只按型号区分，不区分规格）
  const blockProducts = [
    { name: '蒸压加气混凝土砌块', model: '砂加气', unit: '立方米', price: 0, pricingType: 'fixed_price' },
    { name: '蒸压加气混凝土砌块', model: '灰加气', unit: '立方米', price: 0, pricingType: 'fixed_price' },
  ];

  let count = 0;
  for (const p of blockProducts) {
    await prisma.product.create({
      data: {
        name: p.name,
        model: p.model,
        unit: p.unit,
        price: p.price,
        pricingType: p.pricingType,
        status: 'active',
      },
    });
    count++;
  }
  console.log(`新增加气块产品: ${count}条`);

  console.log('\n✅ 产品数据已简化！');
  console.log('\n简化后的产品列表：');

  const products = await prisma.product.findMany({
    orderBy: [{ name: 'asc' }, { model: 'asc' }],
  });

  console.log('\n产品ID\t产品名称\t型号\t单位\t价格');
  products.forEach(p => {
    console.log(`${p.id}\t${p.name}\t${p.model || '-'}\t${p.unit}\t${p.price || 0}`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});