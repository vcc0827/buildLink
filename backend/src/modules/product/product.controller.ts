import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('categories')
  async getCategories() {
    return this.productService.getCategories();
  }

  @Get('by-category/:name')
  async getByCategory(@Param('name') name: string) {
    return this.productService.getByCategory(name);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(Number(id));
  }

  @Post()
  async create(@Body() data: any) {
    return this.productService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.productService.update(Number(id), data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(Number(id));
  }
}
