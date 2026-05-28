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
    const customer = await this.findOne(id);
    
    // 先物理删除所有已软删除的送货单（解除外键约束）
    await this.prisma.deliveryOrder.deleteMany({
      where: {
        AND: [
          {
            OR: [
              { supplierId: id },
              { customerId: id },
            ],
          },
          { deletedAt: { not: null } },
        ],
      },
    });
    
    // 检查是否有关联的送货单（排除已软删除的）
    const deliveryCount = await this.prisma.deliveryOrder.count({
      where: {
        AND: [
          {
            OR: [
              { supplierId: id },
              { customerId: id },
            ],
          },
          { deletedAt: null },
        ],
      },
    });
    
    if (deliveryCount > 0) {
      throw new Error(`该客商已关联 ${deliveryCount} 条送货单记录，无法删除`);
    }
    
    // 检查是否有关联的库存记录
    const stockCount = await this.prisma.stockRecord.count({
      where: {
        OR: [
          { buyerId: id },
          { sellerId: id },
        ],
      },
    });
    
    if (stockCount > 0) {
      throw new Error(`该客商已关联 ${stockCount} 条库存记录，无法删除`);
    }
    
    // 检查是否有关联的合同
    const contractCount = customer.reconciliationUnitId
      ? await this.prisma.contract.count({
          where: { reconciliationUnitId: customer.reconciliationUnitId },
        })
      : 0;
    
    if (contractCount > 0) {
      throw new Error(`该客商已关联 ${contractCount} 条合同记录，无法删除`);
    }
    
    // 检查是否有关联的报货单
    const orderCount = await this.prisma.order.count({
      where: {
        OR: [
          { supplierId: id },
          { customerId: id },
        ],
      },
    });
    
    if (orderCount > 0) {
      throw new Error(`该客商已关联 ${orderCount} 条报货单记录，无法删除`);
    }
    
    // 检查是否有关联的结算单
    const statementCount = await this.prisma.statement.count({
      where: { customerId: id },
    });
    
    if (statementCount > 0) {
      throw new Error(`该客商已关联 ${statementCount} 条结算单记录，无法删除`);
    }
    
    // 检查是否有关联的发票
    const invoiceCount = await this.prisma.invoice.count({
      where: {
        OR: [
          { customerId: id },
          { outputCustomerId: id },
        ],
      },
    });
    
    if (invoiceCount > 0) {
      throw new Error(`该客商已关联 ${invoiceCount} 条发票记录，无法删除`);
    }
    
    // 检查是否有关联的收付款记录
    const paymentCount = await this.prisma.payment.count({
      where: { customerId: id },
    });
    
    if (paymentCount > 0) {
      throw new Error(`该客商已关联 ${paymentCount} 条收付款记录，无法删除`);
    }
    
    return this.prisma.customer.delete({ where: { id } });
  }
}
