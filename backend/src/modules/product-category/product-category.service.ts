import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_CATEGORIES, ProductCategoryDto } from './dto';

@Injectable()
export class ProductCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.productCategory.findMany({
      orderBy: { sort: 'asc' },
    });
    return list.map(c => this.formatCategory(c));
  }

  async findOne(id: number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('产品品类不存在');
    }
    return this.formatCategory(category);
  }

  async findByCode(code: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { code },
    });
    if (!category) {
      throw new NotFoundException(`产品品类「${code}」不存在`);
    }
    return this.formatCategory(category);
  }

  async create(data: ProductCategoryDto) {
    // 检查编码是否已存在
    const existing = await this.prisma.productCategory.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException(`品类编码「${data.code}」已存在`);
    }

    const category = await this.prisma.productCategory.create({
      data: {
        code: data.code,
        name: data.name,
        unit: data.unit,
        fields: data.fields ? JSON.stringify(data.fields) : null,
        status: data.status || 'active',
        sort: data.sort || 0,
      },
    });

    return this.formatCategory(category);
  }

  async update(id: number, data: ProductCategoryDto) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('产品品类不存在');
    }

    // 如果修改了编码，检查新编码是否被占用
    if (data.code && data.code !== existing.code) {
      const codeExists = await this.prisma.productCategory.findFirst({
        where: { code: data.code, id: { not: id } },
      });
      if (codeExists) {
        throw new BadRequestException(`品类编码「${data.code}」已被占用`);
      }
    }

    const category = await this.prisma.productCategory.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        unit: data.unit,
        fields: data.fields ? JSON.stringify(data.fields) : undefined,
        status: data.status,
        sort: data.sort,
      },
    });

    return this.formatCategory(category);
  }

  async remove(id: number) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('产品品类不存在');
    }

    return this.prisma.productCategory.delete({
      where: { id },
    });
  }

  /**
   * 初始化默认品类数据
   */
  async initDefaultCategories() {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await this.prisma.productCategory.findUnique({
        where: { code: cat.code },
      });
      if (!existing) {
        await this.prisma.productCategory.create({
          data: {
            code: cat.code,
            name: cat.name,
            unit: cat.unit,
            fields: JSON.stringify(cat.fields),
            status: 'active',
            sort: cat.sort,
          },
        });
      }
    }
    return { message: '默认品类初始化完成' };
  }

  private formatCategory(category: any) {
    let fields = [];
    try {
      fields = typeof category.fields === 'string'
        ? JSON.parse(category.fields)
        : (category.fields || []);
    } catch {
      fields = [];
    }

    return {
      ...category,
      fields,
    };
  }
}
