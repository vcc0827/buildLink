import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatementService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { no, type, customerId, period, status } = query;
    const where: any = {};
    if (no) where.no = { contains: no };
    if (type) where.type = type;
    if (customerId) where.customerId = +customerId;
    if (period) where.period = period;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.statement.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: { customer: { select: { id: true, name: true } } },
      }),
      this.prisma.statement.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      customerId: item.customer?.id,
      customerName: item.customer?.name,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const statement = await this.prisma.statement.findUnique({
      where: { id },
      include: { customer: { select: { id: true, name: true } } },
    });
    if (!statement) throw new NotFoundException('对账单不存在');
    return { ...statement, customerId: statement.customer?.id, customerName: statement.customer?.name };
  }

  async generate(params: { type: string; customerId: number; period: string }) {
    const { type, customerId, period } = params;
    const no = `DZD-${type === 'upstream' ? 'UP' : 'DN'}-${period.replace('-', '')}-${Date.now().toString().slice(-4)}`;

    const deliveries = await this.prisma.deliveryOrder.findMany({
      where: { 
        [type === 'upstream' ? 'supplierId' : 'projectId']: customerId, 
        status: 'confirmed' 
      },
      include: { items: true },
    });

    const totalAmount = deliveries.reduce((sum: number, d: any) => sum + Number(type === 'upstream' ? d.purchaseTotal : d.salesTotal), 0);

    return this.prisma.statement.create({
      data: {
        no,
        type,
        customerId,
        period,
        totalAmount,
        confirmedAmount: totalAmount,
        status: 'draft',
        items: deliveries.map((d: any) => ({
          deliveryOrderId: d.id,
          deliveryOrderNo: d.no,
          deliveryDate: d.date,
          amount: type === 'upstream' ? d.purchaseTotal : d.salesTotal,
          invoicedAmount: 0,
          paidAmount: 0,
        })),
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.statement.update({ where: { id }, data });
  }
}
