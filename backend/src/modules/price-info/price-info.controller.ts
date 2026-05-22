import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { PriceInfoService } from './price-info.service';
import { PriceInfo } from '@prisma/client';

@Controller('price-info')
export class PriceInfoController {
  constructor(private readonly service: PriceInfoService) {}

  @Post()
  async create(@Body() data: Omit<PriceInfo, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.service.create(data);
  }

  @Get()
  async findAll(
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('model') model?: string,
    @Query('spec') spec?: string,
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page && parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = limit && parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 20;
    return this.service.findAll({ region, category, model, spec, month, page: pageNum, limit: limitNum });
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: Partial<PriceInfo>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.service.remove(id);
  }

  @Get('regions/list')
  async getRegions() {
    return this.service.getDistinctRegions();
  }

  @Get('categories/list')
  async getCategories() {
    return this.service.getDistinctCategories();
  }

  @Get('models/list')
  async getModels(@Query('category') category?: string) {
    return this.service.getDistinctModels(category);
  }
}