import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InvoiceService } from './invoice.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get()
  async list(@Query() query: any) {
    return this.invoiceService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.invoiceService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.invoiceService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.invoiceService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.invoiceService.remove(+id);
  }
}
