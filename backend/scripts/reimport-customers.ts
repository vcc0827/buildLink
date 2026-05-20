import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const customers = [
  { name: '无锡旗鼎建筑材料有限公司', type: 'supplier', category: '供销商', status: 'active' },
  { name: '常州顺邦建材科技有限公司', type: 'manufacturer', category: '砂浆', status: 'active' },
  { name: '常州黑珍珠建材股份有限公司', type: 'manufacturer', category: '加气块', status: 'active' },
  { name: '无锡奕品新型建材有限公司', type: 'manufacturer', status: 'active' },
  { name: '苏州市博鼎新型建材有限公司', type: 'manufacturer', status: 'active' },
  { name: '太仓市建港新型材料有限公司', type: 'manufacturer', category: '加气块', status: 'active' },
  { name: '外购-徐康', type: 'manufacturer', category: '加气块', status: 'active' },
  { name: '上海昊崮新型材料有限公司', type: 'manufacturer', status: 'active' },
  { name: '苏州锦驰建材有限公司', type: 'manufacturer', status: 'active' },
  { name: '无锡市创迪建材有限公司', type: 'manufacturer', category: '粘合剂', status: 'active' },
  { name: '常州市金瑞建材有限公司', type: 'manufacturer', category: '砂浆', status: 'active' },
  { name: '上海良浦新型墙体材料有限公司', type: 'manufacturer', status: 'active' },
  { name: '无锡三创建材有限公司', type: 'manufacturer', status: 'active' },
  { name: '上海舟润建材有限公司', type: 'manufacturer', status: 'active' },
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

async function main() {
  console.log('开始重新导入客户数据...');

  try {
    console.log('正在删除现有客户数据...');
    await prisma.customer.deleteMany();
    console.log('现有客户数据已删除');

    console.log('正在导入新客户数据...');
    for (const customer of customers) {
      await prisma.customer.create({ data: customer });
    }
    console.log(`成功导入 ${customers.length} 条客户数据`);

    console.log('重新导入完成！');
  } catch (error) {
    console.error('导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
