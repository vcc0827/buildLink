import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReconciliationUnitService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { companyName, projectName, status } = query;
    const where: any = {};
    if (companyName) where.companyName = { contains: companyName };
    if (projectName) where.projectName = { contains: projectName };
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.reconciliationUnit.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: { _count: { select: { customers: true } } },
      }),
      this.prisma.reconciliationUnit.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      projectCount: item._count?.customers || 0,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const unit = await this.prisma.reconciliationUnit.findUnique({
      where: { id },
      include: { customers: { select: { id: true, name: true } } },
    });
    if (!unit) throw new NotFoundException('对账单位不存在');
    return unit;
  }

  async create(data: any) {
    return this.prisma.reconciliationUnit.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.reconciliationUnit.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.reconciliationUnit.delete({ where: { id } });
  }
}
