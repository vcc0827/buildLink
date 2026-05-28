import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  async list(@Query() query: any) {
    return this.orderService.findAll(query);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.orderService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.orderService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.orderService.cancel(+id);
  }

  @Post(':id/delivery')
  async createDelivery(@Param('id') id: string, @Body() data: any) {
    return this.orderService.createDelivery(+id, data);
  }
}
