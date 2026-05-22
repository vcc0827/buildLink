import { Module } from '@nestjs/common';
import { PriceInfoService } from './price-info.service';
import { PriceInfoController } from './price-info.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PriceInfoController],
  providers: [PriceInfoService],
})
export class PriceInfoModule {}
