import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';
import { ServiceJobModule } from '../service-job/service-job.module';

@Module({
  imports: [ProductModule, OrderModule, ServiceJobModule],
  controllers: [PosController],
})
export class PosModule {}
