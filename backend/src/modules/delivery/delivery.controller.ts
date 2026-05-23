import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DeliveryService } from './delivery.service';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.deliveryService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
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
  async remove(@Param('id') id: string) {
    return this.deliveryService.remove(+id);
  }

  @Get('product-names/list')
  async getProductNames() {
    return this.deliveryService.getProductNames();
  }

  @Get('customers/list')
  async getCustomerList() {
    return this.deliveryService.getCustomerList();
  }

  @Get('suppliers/list')
  async getSupplierList() {
    return this.deliveryService.getSupplierList();
  }

  @Post('calculate-prices')
  async calculatePrices(@Body() data: { supplierId: number; projectId: number; items: any[] }) {
    return this.deliveryService.calculatePrices(data.supplierId, data.projectId, data.items);
  }

  @Post('import')
  async importDeliveryOrders(@Body() data: any) {
    return this.deliveryService.importDeliveryOrders(data);
  }
}
