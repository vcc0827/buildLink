const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const priceData = [
  { region: '无锡', category: '砂浆', model: '砌筑砂浆', spec: 'dmm5.0', unit: '吨', taxIncludedPrice: 339.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '砌筑砂浆', spec: 'dmm7.5', unit: '吨', taxIncludedPrice: 349.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '砌筑砂浆', spec: 'dmm10', unit: '吨', taxIncludedPrice: 359.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm5.0', unit: '吨', taxIncludedPrice: 349.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm7.5', unit: '吨', taxIncludedPrice: 359.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm10', unit: '吨', taxIncludedPrice: 369.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm15', unit: '吨', taxIncludedPrice: 379.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm20', unit: '吨', taxIncludedPrice: 389.50, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '防水砂浆', spec: 'dwm15', unit: '吨', taxIncludedPrice: 247.46, month: '2026-03' },
  { region: '无锡', category: '砂浆', model: '砌筑砂浆', spec: 'dmm5.0', unit: '吨', taxIncludedPrice: 340.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '砌筑砂浆', spec: 'dmm7.5', unit: '吨', taxIncludedPrice: 350.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '砌筑砂浆', spec: 'dmm10', unit: '吨', taxIncludedPrice: 360.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '砌筑砂浆', spec: 'dmm15', unit: '吨', taxIncludedPrice: 370.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm7.5', unit: '吨', taxIncludedPrice: 360.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm10', unit: '吨', taxIncludedPrice: 370.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '抹灰砂浆', spec: 'dpm15', unit: '吨', taxIncludedPrice: 380.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '地面砂浆', spec: 'dsm15', unit: '吨', taxIncludedPrice: 370.00, month: '2026-04' },
  { region: '无锡', category: '砂浆', model: '地面砂浆', spec: 'dsm20', unit: '吨', taxIncludedPrice: 380.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm5.0', unit: '吨', taxIncludedPrice: 319.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm7.5', unit: '吨', taxIncludedPrice: 333.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm10', unit: '吨', taxIncludedPrice: 347.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm5.0', unit: '吨', taxIncludedPrice: 324.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm10', unit: '吨', taxIncludedPrice: 352.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm15', unit: '吨', taxIncludedPrice: 366.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm20', unit: '吨', taxIncludedPrice: 380.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '地面砂浆', spec: 'dsm20', unit: '吨', taxIncludedPrice: 380.00, month: '2026-03' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm5.0', unit: '吨', taxIncludedPrice: 321.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm7.5', unit: '吨', taxIncludedPrice: 335.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm10', unit: '吨', taxIncludedPrice: 349.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm5.0', unit: '吨', taxIncludedPrice: 326.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm10', unit: '吨', taxIncludedPrice: 354.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm15', unit: '吨', taxIncludedPrice: 368.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm20', unit: '吨', taxIncludedPrice: 382.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '地面砂浆', spec: 'dsm20', unit: '吨', taxIncludedPrice: 382.00, month: '2026-04' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm5.0', unit: '吨', taxIncludedPrice: 321.00, month: '2026-05' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm7.5', unit: '吨', taxIncludedPrice: 335.00, month: '2026-05' },
  { region: '上海', category: '砂浆', model: '砌筑砂浆', spec: 'dmm10', unit: '吨', taxIncludedPrice: 349.00, month: '2026-05' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm5.0', unit: '吨', taxIncludedPrice: 326.00, month: '2026-05' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm10', unit: '吨', taxIncludedPrice: 354.00, month: '2026-05' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm15', unit: '吨', taxIncludedPrice: 368.00, month: '2026-05' },
  { region: '上海', category: '砂浆', model: '抹灰砂浆', spec: 'dpm20', unit: '吨', taxIncludedPrice: 382.00, month: '2026-05' },
  { region: '上海', category: '砂浆', model: '地面砂浆', spec: 'dsm20', unit: '吨', taxIncludedPrice: 382.00, month: '2026-05' },
];

async function main() {
  console.log('开始导入信息价数据...');
  
  const processedData = priceData.map(item => ({
    ...item,
    taxExcludedPrice: (item.taxIncludedPrice / 1.09).toFixed(2)
  }));

  for (const data of processedData) {
    try {
      await prisma.priceInfo.create({
        data: {
          region: data.region,
          category: data.category,
          model: data.model,
          spec: data.spec,
          unit: data.unit,
          taxIncludedPrice: data.taxIncludedPrice,
          taxExcludedPrice: parseFloat(data.taxExcludedPrice),
          month: data.month,
          remark: ''
        }
      });
      console.log(`已导入: ${data.region} - ${data.category} - ${data.model} - ${data.spec} (${data.month})`);
    } catch (error) {
      console.log(`跳过(可能已存在): ${data.region} - ${data.category} - ${data.model} - ${data.spec}`);
    }
  }

  const count = await prisma.priceInfo.count();
  console.log(`\n导入完成！数据库中共有 ${count} 条信息价记录。`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});