import { Module } from '@nestjs/common';
import { DeliveryChargeService } from './delivery-charge.service';
import { DeliveryChargeController } from './delivery-charge.controller';

@Module({
  controllers: [DeliveryChargeController],
  providers: [DeliveryChargeService],
  exports: [DeliveryChargeService],
})
export class DeliveryChargeModule {}
