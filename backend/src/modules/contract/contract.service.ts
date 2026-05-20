import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContractService {
  constructor(private prisma: PrismaService) {}

  private calculatePrice(basePrice: number, adjustmentType: string, adjustmentValue: number): number {
    switch (adjustmentType) {
      case 'percentage':
        return parseFloat((basePrice * (1 + adjustmentValue / 100)).toFixed(2));
      case 'fixed':
        return parseFloat(adjustmentValue.toFixed(2));
      case 'markup':
        return parseFloat((basePrice + adjustmentValue).toFixed(2));
      default:
        return parseFloat(basePrice.toFixed(2));
    }
  }

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, type, status } = query;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (type) where.type = type;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      customerId: item.customer?.id,
      customerName: item.customer?.name,
      itemCount: item.items?.length || 0,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, type: true } },
        items: { include: { product: true } },
      },
    });
    if (!contract) throw new NotFoundException('合同不存在');
    return {
      ...contract,
      customerId: contract.customer?.id,
      customerName: contract.customer?.name,
      customerType: contract.customer?.type,
    };
  }

  async create(data: any) {
    const no = `HT-${Date.now()}`;
    const { items, customerName, customerType, customerId, ...contractData } = data;

    if (contractData.signedDate) {
      contractData.signedDate = new Date(contractData.signedDate);
    } else {
      contractData.signedDate = new Date();
    }
    if (contractData.startDate) {
      contractData.startDate = new Date(contractData.startDate);
    } else {
      contractData.startDate = new Date();
    }
    if (contractData.endDate) {
      contractData.endDate = new Date(contractData.endDate);
    } else {
      contractData.endDate = new Date();
    }

    const contract = await this.prisma.contract.create({
      data: {
        ...contractData,
        no,
        customer: customerId ? { connect: { id: customerId } } : undefined,
      },
    });

    if (items && items.length > 0) {
      await this.prisma.contractItem.createMany({
        data: items.map((item: any) => {
          const price = this.calculatePrice(
            parseFloat(item.basePrice || 0),
            item.adjustmentType || 'fixed',
            parseFloat(item.adjustmentValue || 0)
          );
          return {
            contractId: contract.id,
            productId: item.productId || null,
            productName: item.category,
            unit: item.unit,
            model: item.model || null,
            spec: item.spec || null,
            basePrice: parseFloat(item.basePrice || 0),
            adjustmentType: item.adjustmentType || 'fixed',
            adjustmentValue: parseFloat(item.adjustmentValue || 0),
            price,
          };
        }),
      });
    }

    return this.findOne(contract.id);
  }

  async update(id: number, data: any) {
    const existing = await this.findOne(id);
    const { items, customerName, customerType, id: dataId, createdAt, updatedAt, customer, ...contractData } = data;

    if (contractData.signedDate) {
      contractData.signedDate = new Date(contractData.signedDate);
    } else if (contractData.signedDate === '') {
      delete contractData.signedDate;
    }
    if (contractData.startDate) {
      contractData.startDate = new Date(contractData.startDate);
    } else if (contractData.startDate === '') {
      delete contractData.startDate;
    }
    if (contractData.endDate) {
      contractData.endDate = new Date(contractData.endDate);
    } else if (contractData.endDate === '') {
      delete contractData.endDate;
    }

    await this.prisma.contract.update({
      where: { id },
      data: contractData,
    });

    if (items) {
      await this.prisma.contractItem.deleteMany({ where: { contractId: id } });
      if (items.length > 0) {
        await this.prisma.contractItem.createMany({
          data: items.map((item: any) => {
            const price = this.calculatePrice(
              parseFloat(item.basePrice || 0),
              item.adjustmentType || 'fixed',
              parseFloat(item.adjustmentValue || 0)
            );
            return {
              contractId: id,
              productId: item.productId || null,
              productName: item.productName,
              unit: item.unit,
              model: item.model || null,
              spec: item.spec || null,
              basePrice: parseFloat(item.basePrice || 0),
              adjustmentType: item.adjustmentType || 'fixed',
              adjustmentValue: parseFloat(item.adjustmentValue || 0),
              price,
            };
          }),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.contract.delete({ where: { id } });
  }
}
