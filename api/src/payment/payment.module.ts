import { Module } from '@nestjs/common';
import { BkashModule } from './bkash/bkash.module';
import { SslcommerzModule } from './sslcommerz/sslcommerz.module';

@Module({
  imports: [BkashModule, SslcommerzModule],
  exports: [BkashModule, SslcommerzModule],
})
export class PaymentModule {}
