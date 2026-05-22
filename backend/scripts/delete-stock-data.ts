import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始删除刚才导入的库存数据和项目...');
  
  // 删除4月份的库存记录
  const deletedStockRecords = await prisma.stockRecord.deleteMany({
    where: { month: '2026-04' },
  });
  
  console.log(`📤 删除库存记录: ${deletedStockRecords.count}条`);
  
  // 删除自动创建的项目
  const deletedProjects = await prisma.customer.deleteMany({
    where: {
      type: 'project',
      remark: '从库存数据导入自动创建',
    },
  });
  
  console.log(`📤 删除项目: ${deletedProjects.count}个`);
  
  // 删除自动创建的产品（如果有的话）
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      model: {
        in: ['砂浆', '砌块', '其他'],
      },
    },
  });
  
  console.log(`📤 删除产品: ${deletedProducts.count}个`);
  
  console.log('\n✅ 删除完成！');
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});