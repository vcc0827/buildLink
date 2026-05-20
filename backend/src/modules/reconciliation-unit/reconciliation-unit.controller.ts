import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReconciliationUnitService } from './reconciliation-unit.service';

@Controller('reconciliation-units')
@UseGuards(JwtAuthGuard)
export class ReconciliationUnitController {
  constructor(private reconciliationUnitService: ReconciliationUnitService) {}

  @Get()
  async list(@Query() query: any) {
    return this.reconciliationUnitService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.reconciliationUnitService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.reconciliationUnitService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.reconciliationUnitService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.reconciliationUnitService.remove(+id);
  }
}
