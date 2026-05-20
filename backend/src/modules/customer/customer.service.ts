import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, type, status, reconciliationUnitId, category } = query;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (type) where.type = type;
    if (status) where.status = status;
    if (category) where.category = { contains: category };
    if (reconciliationUnitId) where.reconciliationUnitId = Number(reconciliationUnitId);

    const include: any = {};
    if (type === 'project') {
      include.reconciliationUnit = { select: { id: true, companyName: true, projectName: true } };
    }

    const [list, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include,
      }),
      this.prisma.customer.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      reconciliationUnitName: item.reconciliationUnit?.companyName,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('客商不存在');
    return customer;
  }

  async create(data: any) {
    const createData: any = {};
    
    const allowedFields = ['name', 'type', 'category', 'contact', 'phone', 'address', 'bank', 'account', 'status', 'remark'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        createData[field] = data[field];
      }
    });
    
    if (data.reconciliationUnitId !== undefined && data.reconciliationUnitId !== null) {
      createData.reconciliationUnit = { connect: { id: Number(data.reconciliationUnitId) } };
    }
    
    return this.prisma.customer.create({ data: createData });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const updateData: any = {};
    
    const allowedFields = ['name', 'type', 'category', 'contact', 'phone', 'address', 'bank', 'account', 'status', 'remark'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    if (data.reconciliationUnitId !== undefined) {
      if (data.reconciliationUnitId === null) {
        updateData.reconciliationUnit = { disconnect: true };
      } else {
        updateData.reconciliationUnit = { connect: { id: Number(data.reconciliationUnitId) } };
      }
    }
    
    return this.prisma.customer.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
