import { Module } from '@nestjs/common';
import { ReconciliationUnitController } from './reconciliation-unit.controller';
import { ReconciliationUnitService } from './reconciliation-unit.service';

@Module({
  controllers: [ReconciliationUnitController],
  providers: [ReconciliationUnitService],
  exports: [ReconciliationUnitService],
})
export class ReconciliationUnitModule {}
