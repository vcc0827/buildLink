import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StatementService } from './statement.service';

@Controller('statements')
@UseGuards(JwtAuthGuard)
export class StatementController {
  constructor(private statementService: StatementService) {}

  @Get()
  async list(@Query() query: any) {
    return this.statementService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.statementService.findOne(+id);
  }

  @Post('generate')
  async generate(@Body() params: { type: string; customerId: number; period: string; categoryCode?: string }) {
    return this.statementService.generate(params);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.statementService.update(+id, data);
  }
}
