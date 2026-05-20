import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { ContractModule } from './modules/contract/contract.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { StatementModule } from './modules/statement/statement.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { ReconciliationUnitModule } from './modules/reconciliation-unit/reconciliation-unit.module';
import { StockModule } from './modules/stock/stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'buildlink-secret', signOptions: { expiresIn: '7d' } }),
    PrismaModule,
    AuthModule,
    UserModule,
    CustomerModule,
    ProductModule,
    ContractModule,
    DeliveryModule,
    StatementModule,
    InvoiceModule,
    PaymentModule,
    ReconciliationModule,
    ReconciliationUnitModule,
    StockModule,
  ],
})
export class AppModule {}
