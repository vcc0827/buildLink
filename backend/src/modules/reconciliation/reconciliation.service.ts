import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { type, customerId } = query;
    const where: any = {};
    if (type) where.type = type;
    if (customerId) where.customerId = +customerId;

    const [list, total] = await Promise.all([
      this.prisma.reconciliation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      this.prisma.reconciliation.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: number) {
    const reconciliation = await this.prisma.reconciliation.findUnique({ where: { id } });
    if (!reconciliation) throw new NotFoundException('核销记录不存在');
    return reconciliation;
  }

  async autoReconcile(params: { type: string; customerId: number }) {
    const { type, customerId } = params;

    const statements = await this.prisma.statement.findMany({
      where: { type, customerId, status: 'confirmed' },
    });

    const totalAmount = statements.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0);

    const no = `HX-${type === 'upstream' ? 'UP' : 'DN'}-${Date.now().toString().slice(-6)}`;

    return this.prisma.reconciliation.create({
      data: {
        no,
        type,
        customerId,
        statementId: statements[0]?.id || 0,
        amount: totalAmount,
        reconcileDate: new Date(),
        status: 'confirmed',
      },
    });
  }

  async create(data: any) {
    const no = `HX-${Date.now()}`;
    return this.prisma.reconciliation.create({ data: { ...data, no } });
  }
}
