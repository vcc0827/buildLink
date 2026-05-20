import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentService } from './payment.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  async list(@Query() query: any) {
    return this.paymentService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.paymentService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.paymentService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.paymentService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.paymentService.remove(+id);
  }
}
