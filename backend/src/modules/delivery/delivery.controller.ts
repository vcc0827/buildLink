import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DeliveryService } from './delivery.service';
import {
  CreateDeliveryOrderDto,
  UpdateDeliveryOrderDto,
  DeliveryOrderQueryDto,
  ReconciliationQueryDto,
  ImportDeliveryOrderDto,
} from './dto';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  // ============================================
  // 基础 CRUD
  // ============================================

  @Get()
  async list(@Query() query: DeliveryOrderQueryDto) {
    return this.deliveryService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.deliveryService.findOne(+id);
  }

  @Post()
  async create(@Body() data: CreateDeliveryOrderDto) {
    return this.deliveryService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateDeliveryOrderDto) {
    return this.deliveryService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.deliveryService.remove(+id);
  }

  // ============================================
  // 软删除与恢复
  // ============================================

  @Get('deleted')
  async getDeleted(@Query() query: DeliveryOrderQueryDto) {
    return this.deliveryService.getDeleted(query);
  }

  @Post('restore/:id')
  async restore(@Param('id') id: string) {
    return this.deliveryService.restore(+id);
  }

  // ============================================
  // 批量导入
  // ============================================

  @Post('import')
  async importDeliveryOrders(@Body() data: ImportDeliveryOrderDto) {
    return this.deliveryService.importDeliveryOrders(data);
  }

  // ============================================
  // 上游对账（与厂家对账）
  // ============================================

  @Get('reconciliation/supplier')
  async getSupplierReconciliation(@Query() query: ReconciliationQueryDto) {
    return this.deliveryService.getSupplierReconciliation(query);
  }

  @Get('reconciliation/supplier/detail')
  async getSupplierDeliveryDetail(@Query() query: ReconciliationQueryDto) {
    return this.deliveryService.getSupplierDeliveryDetail(query);
  }

  // ============================================
  // 下游对账（与项目对账）
  // ============================================

  @Get('reconciliation/customer')
  async getCustomerReconciliation(@Query() query: ReconciliationQueryDto) {
    return this.deliveryService.getCustomerReconciliation(query);
  }

  @Get('reconciliation/customer/detail')
  async getCustomerDeliveryDetail(@Query() query: ReconciliationQueryDto) {
    return this.deliveryService.getCustomerDeliveryDetail(query);
  }

  // ============================================
  // 兼容旧接口路由（productType -> categoryCode）
  // ============================================

  // 兼容原来的 /delivery-orders/reconciliation/upstream
  @Get('reconciliation/upstream')
  async getUpstreamReconciliation(@Query() query: any) {
    // 将 productType 转换为 categoryCode
    const newQuery: ReconciliationQueryDto = {
      ...query,
      supplierId: query.supplierId,
      startDate: query.startDate,
      endDate: query.endDate,
      categoryCode: query.productType, // 兼容旧参数
    };
    return this.deliveryService.getSupplierReconciliation(newQuery);
  }

  // 兼容原来的 /delivery-orders/reconciliation/downstream
  @Get('reconciliation/downstream')
  async getDownstreamReconciliation(@Query() query: any) {
    const newQuery: ReconciliationQueryDto = {
      ...query,
      customerId: query.customerId,
      startDate: query.startDate,
      endDate: query.endDate,
      categoryCode: query.productType,
    };
    return this.deliveryService.getCustomerReconciliation(newQuery);
  }
}
