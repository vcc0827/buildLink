import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { no, type, customerId, status } = query;
    const where: any = {};
    if (no) where.no = { contains: no };
    if (type) where.type = type;
    if (customerId) where.customerId = +customerId;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          inputCustomer: { select: { id: true, name: true } },
          outputCustomer: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      inputCustomerName: item.inputCustomer?.name,
      outputCustomerName: item.outputCustomer?.name,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('发票不存在');
    return invoice;
  }

  async create(data: any) {
    const no = `FP-${Date.now()}`;
    return this.prisma.invoice.create({ data: { ...data, no } });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.invoice.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
