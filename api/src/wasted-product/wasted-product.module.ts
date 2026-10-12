import { Module } from '@nestjs/common';
import { WastedProductService } from './wasted-product.service';
import { WastedProductController } from './wasted-product.controller';

@Module({
  controllers: [WastedProductController],
  providers: [WastedProductService],
  exports: [WastedProductService],
})
export class WastedProductModule {}
