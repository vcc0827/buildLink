import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContractService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { no, name, reconciliationUnitId, status } = query;
    const where: any = {};
    if (no) where.no = { contains: no };
    if (name) where.name = { contains: name };
    if (reconciliationUnitId) where.reconciliationUnitId = Number(reconciliationUnitId);
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          reconciliationUnit: { select: { id: true, companyName: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      reconciliationUnitId: item.reconciliationUnit?.id,
      companyName: item.reconciliationUnit?.companyName,
      itemCount: item.items?.length || 0,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        reconciliationUnit: { select: { id: true, companyName: true } },
        items: { include: { product: true } },
      },
    });
    if (!contract) throw new NotFoundException('合同不存在');
    return {
      ...contract,
      reconciliationUnitId: contract.reconciliationUnit?.id,
      companyName: contract.reconciliationUnit?.companyName,
    };
  }

  async create(data: any) {
    const { items, companyName, reconciliationUnitId, ...contractData } = data;

    if (contractData.signedDate) {
      contractData.signedDate = new Date(contractData.signedDate);
    } else {
      contractData.signedDate = new Date();
    }

    const contract = await this.prisma.contract.create({
      data: {
        ...contractData,
        reconciliationUnit: reconciliationUnitId ? { connect: { id: reconciliationUnitId } } : undefined,
      },
    });

    if (items && items.length > 0) {
      await this.prisma.contractItem.createMany({
        data: items.map((item: any) => ({
          contractId: contract.id,
          productId: item.productId || null,
          productName: item.productName,
          unit: item.unit,
          basePrice: parseFloat(item.price || 0),
          adjustmentType: 'fixed_price',
          adjustmentValue: 0,
          price: parseFloat(item.price || 0),
        })),
      });
    }

    return this.findOne(contract.id);
  }

  async update(id: number, data: any) {
    const existing = await this.findOne(id);
    const { items, companyName, id: dataId, createdAt, updatedAt, reconciliationUnit, ...contractData } = data;

    if (contractData.signedDate) {
      contractData.signedDate = new Date(contractData.signedDate);
    }

    await this.prisma.contract.update({
      where: { id },
      data: contractData,
    });

    if (items) {
      await this.prisma.contractItem.deleteMany({ where: { contractId: id } });
      if (items.length > 0) {
        await this.prisma.contractItem.createMany({
          data: items.map((item: any) => ({
            contractId: id,
            productId: item.productId || null,
            productName: item.productName,
            unit: item.unit,
            basePrice: parseFloat(item.price || 0),
            adjustmentType: 'fixed_price',
            adjustmentValue: 0,
            price: parseFloat(item.price || 0),
          })),
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
