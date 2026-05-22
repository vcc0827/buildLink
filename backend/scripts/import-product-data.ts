import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 产品数据
const productData = [
  // 蒸压加气混凝土砌块 - 砂加气
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*200*100', pricingType: 'fixed_price', status: 'active', remark: 'a5.0b06' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*200*150', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*200*200', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*200*250', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*200*300', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*240*100', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*240*200', pricingType: '', status: 'active', remark: '' },
  
  // 蒸压加气混凝土砌块 - 灰加气
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '灰加气', spec: '600*200*100', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '灰加气', spec: '600*200*150', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '灰加气', spec: '600*200*200', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '灰加气', spec: '600*200*250', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '灰加气', spec: '600*200*300', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '灰加气', spec: '600*240*100', pricingType: '', status: 'active', remark: '' },
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '灰加气', spec: '600*240*200', pricingType: '', status: 'active', remark: '' },
  
  // 砂浆 - 砌筑砂浆
  { name: '砂浆', unit: '吨', model: '砌筑砂浆', spec: 'dmm5.0', pricingType: 'info_price', status: 'active', remark: '预拌干混砂浆' },
  { name: '砂浆', unit: '吨', model: '砌筑砂浆', spec: 'dmm7.5', pricingType: 'info_price', status: 'active', remark: '' },
  { name: '砂浆', unit: '吨', model: '砌筑砂浆', spec: 'dmm10', pricingType: 'info_price', status: 'active', remark: '' },
  { name: '砂浆', unit: '吨', model: '砌筑砂浆', spec: 'dmm15', pricingType: 'info_price', status: 'active', remark: '' },
  
  // 砂浆 - 抗裂砂浆
  { name: '砂浆', unit: '吨', model: '抗裂砂浆', spec: '', pricingType: 'info_price', status: 'active', remark: '' },
  
  // 砂浆 - 抹灰砂浆
  { name: '砂浆', unit: '吨', model: '抹灰砂浆', spec: 'dpm5.0', pricingType: 'info_price', status: 'active', remark: '' },
  { name: '砂浆', unit: '吨', model: '抹灰砂浆', spec: 'dpm7.5', pricingType: 'info_price', status: 'active', remark: '' },
  { name: '砂浆', unit: '吨', model: '抹灰砂浆', spec: 'dpm10', pricingType: 'info_price', status: 'active', remark: '' },
  { name: '砂浆', unit: '吨', model: '抹灰砂浆', spec: 'dpm15', pricingType: 'info_price', status: 'active', remark: '' },
  { name: '砂浆', unit: '吨', model: '抹灰砂浆', spec: 'dpm20', pricingType: 'info_price', status: 'active', remark: '' },
  { name: '砂浆', unit: '吨', model: '抹灰砂浆', spec: 'dwm15', pricingType: 'info_price', status: 'active', remark: '' },
  
  // 砂浆 - 自流平
  { name: '砂浆', unit: '吨', model: '自流平', spec: '', pricingType: 'info_price', status: 'active', remark: '' },
  
  // 粘结剂
  { name: '粘结剂', unit: '吨', model: '加气块粘合剂', spec: 'MA5.0灰', pricingType: '', status: 'active', remark: '' },
  { name: '粘结剂', unit: '吨', model: '加气块粘合剂', spec: 'MA10白', pricingType: '', status: 'active', remark: '' },
];

async function main() {
  console.log('开始导入产品数据...');
  
  // 删除现有产品数据
  const deleted = await prisma.product.deleteMany({});
  console.log(`已删除 ${deleted.count} 条旧产品数据`);
  
  // 导入新产品数据
  let count = 0;
  for (const product of productData) {
    await prisma.product.create({
      data: {
        name: product.name,
        unit: product.unit,
        model: product.model || '',
        spec: product.spec || '',
        pricingType: product.pricingType || 'fixed_price',
        status: product.status,
        remark: product.remark || undefined,
      },
    });
    count++;
  }
  
  console.log(`\n✅ 导入完成！`);
  console.log(`新增产品: ${count}条`);
  console.log(`\n产品分类统计:`);
  console.log(`- 蒸压加气混凝土砌块: 14条`);
  console.log(`- 砂浆: 14条`);
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});