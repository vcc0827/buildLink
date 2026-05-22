import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PriceInfo } from '@prisma/client';

@Injectable()
export class PriceInfoService {
  constructor(private prisma: PrismaService) {}

  async create(data: Omit<PriceInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<PriceInfo> {
    return this.prisma.priceInfo.create({ data });
  }

  async findAll(params: {
    region?: string;
    category?: string;
    model?: string;
    spec?: string;
    month?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PriceInfo[]; total: number }> {
    const { region, category, model, spec, month, page, limit } = params;
    
    const pageNum = page && page > 0 ? Number(page) : 1;
    const limitNum = limit && limit > 0 ? Number(limit) : 20;
    
    const where: any = {};
    if (region) where.region = region;
    if (category) where.category = category;
    if (model) where.model = model;
    if (spec) where.spec = spec;
    if (month) where.month = month;

    const [data, total] = await Promise.all([
      this.prisma.priceInfo.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.priceInfo.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number): Promise<PriceInfo | null> {
    return this.prisma.priceInfo.findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<PriceInfo>): Promise<PriceInfo> {
    return this.prisma.priceInfo.update({ where: { id }, data });
  }

  async remove(id: number): Promise<PriceInfo> {
    return this.prisma.priceInfo.delete({ where: { id } });
  }

  async findByMonthAndRegion(month: string, region: string): Promise<PriceInfo[]> {
    return this.prisma.priceInfo.findMany({
      where: { month, region },
      orderBy: { category: 'asc' },
    });
  }

  async getDistinctRegions(): Promise<string[]> {
    const result = await this.prisma.priceInfo.findMany({
      distinct: ['region'],
      select: { region: true },
    });
    return result.map(item => item.region);
  }

  async getDistinctCategories(): Promise<string[]> {
    const result = await this.prisma.priceInfo.findMany({
      distinct: ['category'],
      select: { category: true },
    });
    return result.map(item => item.category);
  }

  async getDistinctModels(category?: string): Promise<string[]> {
    const where = category ? { category } : {};
    const result = await this.prisma.priceInfo.findMany({
      where,
      distinct: ['model'],
      select: { model: true },
    });
    return result.map(item => item.model);
  }
}