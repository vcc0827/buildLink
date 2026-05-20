import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始同步对账单位到项目...');

  // 获取所有对账单位
  const reconciliationUnits = await prisma.reconciliationUnit.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      companyName: true,
      projectName: true,
      contact: true,
      phone: true,
    },
  });

  console.log(`找到 ${reconciliationUnits.length} 个对账单位`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const unit of reconciliationUnits) {
    // 检查是否已存在同名项目
    const existingProject = await prisma.customer.findFirst({
      where: {
        type: 'project',
        name: unit.projectName,
        reconciliationUnitId: unit.id,
      },
    });

    if (existingProject) {
      // 更新现有项目
      await prisma.customer.update({
        where: { id: existingProject.id },
        data: {
          contact: unit.contact,
          phone: unit.phone,
          remark: `关联对账单位: ${unit.companyName}`,
        },
      });
      updatedCount++;
    } else if (unit.projectName) {
      // 创建新项目
      await prisma.customer.create({
        data: {
          name: unit.projectName,
          type: 'project',
          category: '',
          contact: unit.contact,
          phone: unit.phone,
          remark: `关联对账单位: ${unit.companyName}`,
          status: 'active',
          reconciliationUnit: { connect: { id: unit.id } },
        },
      });
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n同步完成！`);
  console.log(`创建新项目: ${createdCount}`);
  console.log(`更新现有项目: ${updatedCount}`);
  console.log(`跳过(无项目名称): ${skippedCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});