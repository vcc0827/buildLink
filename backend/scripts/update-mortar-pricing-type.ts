import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始更新砂浆产品的计价类型...');
  
  // 更新所有产品名称为"砂浆"的产品，将计价类型改为"信息价"
  const updated = await prisma.product.updateMany({
    where: {
      name: '砂浆',
    },
    data: {
      pricingType: 'info_price',
    },
  });
  
  console.log(`✅ 更新完成！`);
  console.log(`共更新 ${updated.count} 条砂浆产品的计价类型为"信息价"`);
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});