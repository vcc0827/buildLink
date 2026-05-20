import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reconciliationUnits = [
  { companyName: '安徽杳壹建筑工程有限公司', projectName: '上海至南通铁路太仓至四团引入东方枢纽上海东站站场区地上及相关工程SHDDSSG-3标段', status: 'active' },
  { companyName: '苏州市新绿建筑工程有限责任公司', projectName: '无锡建发观云项目', status: 'active' },
  { companyName: '宜安建设', projectName: '宜安建设博士空调项目', status: 'active' },
  { companyName: '无锡惠达环保工程有限公司', projectName: '惠达环保扩建项目', status: 'active' },
  { companyName: '山东万泰建设集团有限公司', projectName: '荣昌生物全球研发总部项目', status: 'active' },
  { companyName: '南京永聚建筑安装工程有限公司', projectName: '无锡望愉地铁XDG-2019-54号地块', status: 'active' },
  { companyName: '安徽常合建设有限公司', projectName: '无锡望愉地铁XDG-2019-54地块项目', status: 'active' },
  { companyName: '零售', projectName: '勤政建设', status: 'active' },
  { companyName: '宜兴营承', projectName: '胡埭厂房', status: 'active' },
  { companyName: '江苏智能优建设工程有限公司', projectName: '美源新农业配套设施项目', status: 'active' },
  { companyName: '无锡二建 无锡卓晟建设有限公司', projectName: '奥凯机电167号房', status: 'active' },
  { companyName: '无锡二建 无锡卓晟建设有限公司', projectName: '奥凯机电258号房', status: 'active' },
  { companyName: '安徽杳壹建筑工程有限公司', projectName: '上海至南通铁路太仓至四团引入东方枢纽上海东站站场区地上及相关工程SHDDSSG-3标段', status: 'active' },
  { companyName: '中建八局', projectName: '无锡锡北镇项目', status: 'active' },
  { companyName: '无锡城投', projectName: '云林里项目', status: 'active' },
  { companyName: '江苏智能优建设工程有限公司', projectName: '无锡量子感知研究所', status: 'active' },
  { companyName: '浪淘沙', projectName: '冠亚二期', status: 'active' },
  { companyName: '无锡二建 无锡卓晟建设有限公司', projectName: '奥凯机电4#9号楼', status: 'active' },
  { companyName: '江苏中匠建业建设工程有限公司', projectName: '旭峰开泰智创中心项目', status: 'active' },
  { companyName: '江苏中匠建业建设工程有限公司', projectName: '旭峰开泰智创中心项目', status: 'active' },
  { companyName: '无锡二建 无锡卓晟建设有限公司', projectName: '奥凯机电4#9号楼', status: 'active' },
  { companyName: '江苏聚烁', projectName: '江苏聚烁高端数字化后项目', status: 'active' },
  { companyName: '江苏省建', projectName: '屹信航天总部暨研发生产基地建设项目', status: 'active' },
  { companyName: '江苏昊林建设工程有限公司', projectName: '羊尖工地', status: 'active' },
  { companyName: '江苏昊林建设工程有限公司', projectName: '无锡雅泰项目', status: 'active' },
  { companyName: '安徽杳壹建筑工程有限公司', projectName: '上海至南通铁路太仓至四团引入东方枢纽上海东站站场区地上及相关工程SHDDSSG-3标段', status: 'active' },
  { companyName: '安徽杳壹建筑工程有限公司', projectName: '上海至南通铁路太仓至四团引入东方枢纽上海东站站场区地上及相关工程SHDDSSG-3标段', status: 'active' },
  { companyName: '亨利富', projectName: '胡埭九龙湾', status: 'active' },
  { companyName: '四川新大江', projectName: '胡埭九龙湾', status: 'active' },
  { companyName: '安徽奥正', projectName: '胡埭九龙湾', status: 'active' },
  { companyName: '江阴正之建建设', projectName: '年产2200万套汽车部件智能制造项目（一期）', status: 'active' },
  { companyName: '江苏中匠建业建设工程有限公司', projectName: '格尔顿项目', status: 'active' },
];

const customers = [
  { name: '无锡旗鼎建筑材料有限公司', type: 'manufacturer', category: '供销商', status: 'active' },
  { name: '常州顺邦建材科技有限公司', type: 'supplier', category: '砂浆', status: 'active' },
  { name: '常州黑珍珠建材股份有限公司', type: 'supplier', category: '加气块', status: 'active' },
  { name: '无锡奕品新型建材有限公司', type: 'supplier', status: 'active' },
  { name: '苏州市博鼎新型建材有限公司', type: 'supplier', status: 'active' },
  { name: '太仓市建港新型材料有限公司', type: 'supplier', category: '加气块', status: 'active' },
  { name: '外购-徐康', type: 'supplier', category: '加气块', status: 'active' },
  { name: '上海昊崮新型材料有限公司', type: 'supplier', status: 'active' },
  { name: '苏州锦驰建材有限公司', type: 'supplier', status: 'active' },
  { name: '无锡市创迪建材有限公司', type: 'supplier', category: '粘合剂', status: 'active' },
  { name: '常州市金瑞建材有限公司', type: 'supplier', category: '砂浆', status: 'active' },
  { name: '上海良浦新型墙体材料有限公司', type: 'supplier', status: 'active' },
  { name: '无锡三创建材有限公司', type: 'supplier', status: 'active' },
  { name: '上海舟润建材有限公司', type: 'supplier', status: 'active' },
  { name: '上海至南通铁路太仓至四团引入东方枢纽上海东站站场区地上及相关工程SHDDSSG-3标段', type: 'project', status: 'active' },
  { name: '无锡建发观云项目', type: 'project', status: 'active' },
  { name: '博世空调项目', type: 'project', status: 'active' },
  { name: '惠达环保扩建项目', type: 'project', status: 'active' },
  { name: '荣昌生物全球研发总部项目', type: 'project', status: 'active' },
  { name: '无锡望愉地铁XDG-2019-54号地块', type: 'project', status: 'active' },
  { name: '勤政建设', type: 'project', status: 'active' },
  { name: '胡埭厂房', type: 'project', status: 'active' },
  { name: '美源新农业配套设施项目', type: 'project', status: 'active' },
  { name: '奥凯机电167号房', type: 'project', status: 'active' },
  { name: '奥凯机电258号房', type: 'project', status: 'active' },
  { name: '无锡锡北镇项目', type: 'project', status: 'active' },
  { name: '云林里项目', type: 'project', status: 'active' },
  { name: '无锡量子感知研究所', type: 'project', status: 'active' },
  { name: '冠亚二期', type: 'project', status: 'active' },
  { name: '奥凯机电4#9号楼', type: 'project', status: 'active' },
  { name: '旭峰开泰智创中心项目', type: 'project', status: 'active' },
  { name: '奥凯机电4#9号楼', type: 'project', status: 'active' },
  { name: '江苏聚烁高端数字化后项目', type: 'project', status: 'active' },
  { name: '屹信航天总部暨研发生产基地建设项目', type: 'project', status: 'active' },
  { name: '羊尖工地', type: 'project', status: 'active' },
  { name: '无锡雅泰项目', type: 'project', status: 'active' },
  { name: '上海至南通铁路太仓至四团引入东方枢纽上海东站站场区地上及相关工程SHDDSSG-3标段', type: 'project', status: 'active' },
  { name: '胡埭九龙湾', type: 'project', status: 'active' },
  { name: '年产2200万套汽车部件智能制造项目（一期）', type: 'project', status: 'active' },
  { name: '格尔顿项目', type: 'project', status: 'active' },
];

const products = [
  { name: '蒸压加气混凝土砌块', unit: '立方米', model: '砂加气', spec: '600*200*200', pricingType: 'fixed_price', status: 'active', remark: 'a5.0b06' },
  { name: '砂浆', unit: '吨', model: '砌筑砂浆', spec: 'dmm5.0', status: 'active', remark: '预拌干混砂浆' },
];

async function main() {
  console.log('开始导入数据...');

  try {
    console.log('正在导入 ReconciliationUnit...');
    for (const unit of reconciliationUnits) {
      await prisma.reconciliationUnit.create({ data: unit });
    }
    console.log(`成功导入 ${reconciliationUnits.length} 条对账单位数据`);

    console.log('正在导入 Customer...');
    for (const customer of customers) {
      await prisma.customer.create({ data: customer });
    }
    console.log(`成功导入 ${customers.length} 条客户数据`);

    console.log('正在导入 Product...');
    for (const product of products) {
      await prisma.product.create({ data: product });
    }
    console.log(`成功导入 ${products.length} 条产品数据`);

    console.log('数据导入完成！');
  } catch (error) {
    console.error('数据导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
