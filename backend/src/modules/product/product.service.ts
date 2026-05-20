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
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async getCategories() {
    const categories = await this.prisma.product.findMany({
      distinct: ['name'],
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return categories.map(c => c.name);
  }

  async getByCategory(name: string) {
    return this.prisma.product.findMany({
      where: { name },
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
