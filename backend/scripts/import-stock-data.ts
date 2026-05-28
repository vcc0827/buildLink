import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 入库数据 ====================
const stockInData = [
  { unit: '三创', productName: '加气块', quantity: 387.072, amount: 42132.62, price: 108.85 },
  { unit: '三创', productName: '加气块', quantity: 72.576, amount: 6294.2, price: 86.73 },
  { unit: '黑珍珠', productName: '加气块', quantity: 487.512, amount: 51771.19, price: 106.19 },
  { unit: '黑珍珠', productName: '加气块', quantity: 224.208, amount: 23809.7, price: 106.19 },
  { unit: '三创', productName: '加气块', quantity: 86.22, amount: 9385.01, price: 108.85 },
  { unit: '三创', productName: '加气块', quantity: 356.796, amount: 30943.37, price: 86.73 },
  { unit: '创迪', productName: '抗裂砂浆', quantity: 1, amount: 486.73, price: 486.73 },
  { unit: '金瑞', productName: '砂浆DMM5.0', quantity: 11, amount: 1654.87, price: 150.44 },
  { unit: '金瑞', productName: '砂浆DPM15', quantity: 70, amount: 12389.38, price: 176.99 },
  { unit: '金瑞', productName: '砂浆DPM10', quantity: 127, amount: 21353.98, price: 168.14 },
  { unit: '吉邦', productName: '自流平', quantity: 2, amount: 1238.94, price: 619.47 },
  { unit: '顺邦', productName: '砂浆DMM10', quantity: 580, amount: 88495.58, price: 152.58 },
  { unit: '顺邦', productName: '砂浆DMM10', quantity: 290, amount: 44247.79, price: 152.58 },
  { unit: '金瑞', productName: '砂浆DPM5.0', quantity: 150, amount: 26548.67, price: 176.99 },
  { unit: '创迪', productName: '粘结剂MA5.0灰', quantity: 26, amount: 6902.65, price: 265.49 },
  { unit: '创迪', productName: '粘结剂MA5.0灰', quantity: 6, amount: 1752.21, price: 292.04 },
];

// ==================== 出库数据 ====================
const stockOutData = [ /* ... 保持不变 */ ];

// 厂家映射（必须和数据库完全一致）
const manufacturerMap: Record<string, string> = {
  '三创': '无锡三创建材有限公司',
  '黑珍珠': '常州黑珍珠建材股份有限公司',
  '创迪': '无锡市创迪建材有限公司',
  '金瑞': '常州市金瑞建材有限公司',
  '吉邦': '苏州吉邦新材料有限公司',
  '顺邦': '常州顺邦建材科技有限公司',
};

async function getManufacturerId(shortName: string): Promise<number | null> {
  const fullName = manufacturerMap[shortName];
  if (!fullName) {
    console.warn(`⚠️ 未知厂家: ${shortName}`);
    return null;
  }

  const manufacturer = await prisma.customer.findFirst({
    where: { 
      type: 'supplier', 
      name: fullName   // 必须精确匹配
    },
    select: { id: true, name: true },
  });

  if (!manufacturer) {
    console.warn(`❌ 数据库中未找到供应商: ${shortName} → ${fullName}`);
  } else {
    console.log(`✅ 找到供应商: ${shortName} → ${manufacturer.name} (ID: ${manufacturer.id})`);
  }

  return manufacturer?.id || null;
}

async function getProductId(productName: string): Promise<number | null> {
  const product = await prisma.product.findFirst({
    where: {
      name: {
        contains: productName,
      },
    },
    select: { id: true, name: true },
  });

  if (!product) {
    console.warn(`❌ 数据库中未找到产品: ${productName}`);
  } else {
    console.log(`✅ 找到产品: ${productName} → ${product.name} (ID: ${product.id})`);
  }

  return product?.id || null;
}

async function main() {
  console.log('🚀 开始导入2026年4月份库存数据...\n');

  // 清空旧数据（建议第一次导入时打开）
  // await prisma.stockRecord.deleteMany({});
  // console.log('🗑️ 已清空原有库存记录\n');

  const defaultSupplier = await prisma.customer.findFirst({
    where: { type: 'supplier' },
    select: { id: true, name: true },
  });

  if (!defaultSupplier) {
    console.error('❌ 未找到供应商！');
    process.exit(1);
  }

  console.log(`✅ 默认采购方(顺邦): ${defaultSupplier.name} (ID: ${defaultSupplier.id})\n`);

  let inCount = 0;

  for (const [index, item] of stockInData.entries()) {
    try {
      const sellerId = await getManufacturerId(item.unit);
      const productId = await getProductId(item.productName);   // 假设你已有此函数

      if (!sellerId || !productId) {
        console.warn(`⛔ 跳过入库: ${item.unit} - ${item.productName}`);
        continue;
      }

      await prisma.stockRecord.create({
        data: {
          no: `STOCK-IN-202604-${String(index).padStart(3, '0')}`,
          date: new Date('2026-04-15'),
          month: '2026-04',
          type: 'stock_in',
          productId,
          buyerId: defaultSupplier.id,     // 我们自己（顺邦）
          sellerId: sellerId,              // 关键：外部厂家（三创等）
          unit: item.productName.includes('砂浆') || item.productName.includes('粘结剂') ? '吨' : 'm³',
          quantity: item.quantity,
          unitPrice: item.price,
          amount: item.amount,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: item.amount,
          remark: `4月份入库 - ${item.unit}`,
        },
      });

      inCount++;
    } catch (err: any) {
      console.error(`❌ 创建失败 ${item.unit}-${item.productName}:`, err.message);
    }
  }

  console.log(`\n🎉 导入完成！共成功导入 ${inCount} 条入库记录`);
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => prisma.$disconnect());