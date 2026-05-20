import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StockService } from './stock.service';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private stockService: StockService) {}

  // 获取库存记录列表
  @Get('records')
  async list(@Query() query: any) {
    return this.stockService.findAll(query);
  }

  // 获取带上期库存的记录（用于前端表格展示）
  @Get('records-with-balance')
  async listWithBalance(@Query() query: any) {
    return this.stockService.getRecordsWithPreviousStock(query);
  }

  // 获取单条库存记录
  @Get('records/:id')
  async getById(@Param('id') id: string) {
    return this.stockService.findOne(+id);
  }

  // 创建库存记录
  @Post('records')
  async create(@Body() data: any) {
    return this.stockService.create(data);
  }

  // 更新库存记录
  @Put('records/:id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.stockService.update(+id, data);
  }

  // 删除库存记录
  @Delete('records/:id')
  async delete(@Param('id') id: string) {
    return this.stockService.remove(+id);
  }

  // 获取库存汇总数据
  @Get('summary')
  async getSummary(@Query() query: any) {
    return this.stockService.getSummary(query);
  }
}
