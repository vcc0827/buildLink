import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始统一客户类型...');

  try {
    console.log('正在将 manufacturer 类型改为 supplier...');
    const result = await prisma.customer.updateMany({
      where: { type: 'manufacturer' },
      data: { type: 'supplier' }
    });
    console.log(`成功更新 ${result.count} 条记录`);

    console.log('统一完成！');
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
