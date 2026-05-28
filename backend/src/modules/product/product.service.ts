import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, status } = query;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('产品不存在');
    return product;
  }

  async create(data: any) {
    return this.prisma.product.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    if (data.categoryId) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (category) {
        data.categoryCode = category.code;
      }
    }
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async getCategories() {
    const categories = await this.prisma.product.findMany({
      distinct: ['categoryCode'],
      where: { categoryCode: { not: null } },
      select: {
        categoryCode: true,
        category: { select: { name: true } },
      },
      orderBy: { categoryCode: 'asc' },
    });
    return categories.map(c => ({
      code: c.categoryCode,
      name: c.category?.name || c.categoryCode,
    }));
  }

  async getByCategory(code: string) {
    return this.prisma.product.findMany({
      where: { categoryCode: code },
      select: {
        id: true,
        name: true,
        model: true,
        spec: true,
        unit: true,
        price: true,
      },
      orderBy: [{ model: 'asc' }, { spec: 'asc' }],
    });
  }
}
