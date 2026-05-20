import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CustomerService } from './customer.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get()
  async list(@Query() query: any) {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.customerService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.customerService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.customerService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }
}
