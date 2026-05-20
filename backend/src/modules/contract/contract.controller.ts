import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ContractService } from './contract.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Get()
  async list(@Query() query: any) {
    return this.contractService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.contractService.findOne(+id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.contractService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.contractService.update(+id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.contractService.remove(+id);
  }
}
