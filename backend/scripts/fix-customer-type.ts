import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始修复客户类型...');

  const manufacturersToUpdate = [
    { name: '无锡旗鼎建筑材料有限公司', newType: 'supplier', newCategory: '经销商' }
  ];

  for (const item of manufacturersToUpdate) {
    const result = await prisma.customer.updateMany({
      where: { name: item.name, type: 'manufacturer' },
      data: { type: item.newType, category: item.newCategory }
    });
    console.log(`已将 "${item.name}" 的类型从厂家改为经销商，更新了 ${result.count} 条记录`);
  }

  await prisma.$disconnect();
  console.log('修复完成！');
}

main();
