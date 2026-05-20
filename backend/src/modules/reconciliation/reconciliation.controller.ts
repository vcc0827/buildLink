import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReconciliationService } from './reconciliation.service';

@Controller('reconciliations')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private reconciliationService: ReconciliationService) {}

  @Get()
  async list(@Query() query: any) {
    return this.reconciliationService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.reconciliationService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.reconciliationService.create(data);
  }

  @Post('auto')
  async autoReconcile(@Body() params: { type: string; customerId: number }) {
    return this.reconciliationService.autoReconcile(params);
  }
}
