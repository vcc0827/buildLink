import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DeliveryService } from './delivery.service';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get('deleted')
  async getDeleted(@Query() query: any) {
    return this.deliveryService.getDeleted(query);
  }

  @Get('reconciliation/supplier')
  async getSupplierReconciliation(@Query() query: any) {
    return this.deliveryService.getSupplierReconciliation(query);
  }

  @Get('reconciliation/supplier/detail')
  async getSupplierDeliveryDetail(@Query() query: any) {
    return this.deliveryService.getSupplierDeliveryDetail(query);
  }

  @Get('reconciliation/customer')
  async getCustomerReconciliation(@Query() query: any) {
    return this.deliveryService.getCustomerReconciliation(query);
  }

  @Get('reconciliation/customer/detail')
  async getCustomerDeliveryDetail(@Query() query: any) {
    return this.deliveryService.getCustomerDeliveryDetail(query);
  }

  @Get()
  async list(@Query() query: any) {
    return this.deliveryService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.deliveryService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.deliveryService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.deliveryService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.deliveryService.remove(+id);
  }

  @Post('restore/:id')
  async restore(@Param('id') id: string) {
    return this.deliveryService.restore(+id);
  }

  @Post('import')
  async importDeliveryOrders(@Body() data: any) {
    return this.deliveryService.importDeliveryOrders(data);
  }
}
