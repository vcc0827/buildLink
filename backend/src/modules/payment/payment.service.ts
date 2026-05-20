import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentService {
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
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: { customer: { select: { id: true, name: true } } },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      customerId: item.customer?.id,
      customerName: item.customer?.name,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { customer: { select: { id: true, name: true } } },
    });
    if (!payment) throw new NotFoundException('收付款记录不存在');
    return { ...payment, customerId: payment.customer?.id, customerName: payment.customer?.name };
  }

  async create(data: any) {
    const no = data.type === 'payment' ? `FK-${Date.now()}` : `HK-${Date.now()}`;
    return this.prisma.payment.create({ data: { ...data, no } });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.payment.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.payment.delete({ where: { id } });
  }
}
