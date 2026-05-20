import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const manufacturers = [
  { name: '常州顺邦建材科技有限公司', type: 'manufacturer', category: '砂浆', status: 'active' },
  { name: '上海昊崮新型材料有限公司', type: 'manufacturer', category: '砂浆', status: 'active' },
  { name: '常州市金瑞建材有限公司', type: 'manufacturer', category: '砂浆', status: 'active' },
  { name: '常州黑珍珠建材股份有限公司', type: 'manufacturer', category: '砌块', status: 'active' },
  { name: '太仓市建港新型材料有限公司', type: 'manufacturer', category: '砌块', status: 'active' },
  { name: '外购-徐康', type: 'manufacturer', category: '砌块', status: 'active' },
  { name: '上海良浦新型墙体材料有限公司', type: 'manufacturer', category: '砌块', status: 'active' },
  { name: '无锡三创建材有限公司', type: 'manufacturer', category: '砌块', status: 'active' },
  { name: '上海舟润建材有限公司', type: 'manufacturer', category: '砌块', status: 'active' },
  { name: '无锡市创迪建材有限公司', type: 'manufacturer', category: '砌块', status: 'active' },
];

const suppliers = [
  { name: '无锡旗鼎建筑材料有限公司', type: 'supplier', category: '供销商', status: 'active' },
];

async function main() {
  console.log('开始重新导入厂家数据...');

  try {
    console.log('正在删除现有厂家和供应商数据...');
    await prisma.customer.deleteMany({
      where: { type: { in: ['manufacturer', 'supplier'] } }
    });
    console.log('现有厂家和供应商数据已删除');

    console.log('正在导入新厂家数据...');
    for (const manufacturer of manufacturers) {
      await prisma.customer.create({ data: manufacturer });
    }
    console.log(`成功导入 ${manufacturers.length} 条厂家数据`);

    console.log('正在导入供应商数据...');
    for (const supplier of suppliers) {
      await prisma.customer.create({ data: supplier });
    }
    console.log(`成功导入 ${suppliers.length} 条供应商数据`);

    console.log('重新导入完成！');
  } catch (error) {
    console.error('导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
