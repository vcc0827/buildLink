import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryDto } from './dto';

@Controller('product-categories')
@UseGuards(JwtAuthGuard)
export class ProductCategoryController {
  constructor(private productCategoryService: ProductCategoryService) {}

  @Get()
  async findAll() {
    return this.productCategoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productCategoryService.findOne(+id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.productCategoryService.findByCode(code);
  }

  @Post()
  async create(@Body() data: ProductCategoryDto) {
    return this.productCategoryService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: ProductCategoryDto) {
    return this.productCategoryService.update(+id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productCategoryService.remove(+id);
  }

  @Post('init')
  async initDefault() {
    return this.productCategoryService.initDefaultCategories();
  }
}
