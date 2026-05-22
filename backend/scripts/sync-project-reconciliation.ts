import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 项目名称映射（处理名称不完全匹配的情况）
const projectNameMapping: Record<string, string> = {
  '博世空调项目': '宜安建设博士空调项目',
};

async function main() {
  console.log('开始同步项目与对账单位关联...');
  
  try {
    // 获取所有项目
    const projects = await prisma.customer.findMany({
      where: { type: 'project' },
      select: { id: true, name: true, reconciliationUnitId: true },
    });
    
    console.log(`找到 ${projects.length} 个项目`);
    
    // 获取所有对账单位
    const units = await prisma.reconciliationUnit.findMany({
      select: { id: true, companyName: true, projectName: true },
    });
    
    console.log(`找到 ${units.length} 个对账单位`);
    
    // 统计变量
    let matchedCount = 0;
    let alreadyMatchedCount = 0;
    let notFoundCount = 0;
    const notFoundProjects: string[] = [];
    
    // 逐个匹配项目
    for (const project of projects) {
      // 如果已经关联了对账单位，跳过
      if (project.reconciliationUnitId) {
        alreadyMatchedCount++;
        continue;
      }
      
      // 使用映射名称或原名称查找
      const searchName = projectNameMapping[project.name] || project.name;
      
      // 查找匹配的对账单位
      const unit = units.find(u => u.projectName === searchName);
      
      if (unit) {
        // 更新项目的对账单位关联
        await prisma.customer.update({
          where: { id: project.id },
          data: { reconciliationUnitId: unit.id },
        });
        console.log(`✓ 项目 "${project.name}" 已关联对账单位: ${unit.companyName}`);
        matchedCount++;
      } else {
        notFoundProjects.push(project.name);
        notFoundCount++;
      }
    }
    
    // 输出统计结果
    console.log('\n' + '='.repeat(60));
    console.log('同步完成！');
    console.log(`已关联: ${matchedCount} 个`);
    console.log(`已存在关联: ${alreadyMatchedCount} 个`);
    console.log(`未找到匹配: ${notFoundCount} 个`);
    
    if (notFoundProjects.length > 0) {
      console.log('\n未找到匹配的项目:');
      notFoundProjects.forEach(name => console.log(`  - ${name}`));
    }
    
  } catch (error) {
    console.error('同步失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
