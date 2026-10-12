import { Module } from '@nestjs/common';
import { WantedProductService } from './wanted-product.service';
import { WantedProductController } from './wanted-product.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WantedProductController],
  providers: [WantedProductService],
  exports: [WantedProductService],
})
export class WantedProductModule {}
