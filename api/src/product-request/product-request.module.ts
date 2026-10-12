import { Module } from '@nestjs/common';
import { ProductRequestService } from './product-request.service';
import { ProductRequestController } from './product-request.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductRequestController],
  providers: [ProductRequestService],
  exports: [ProductRequestService],
})
export class ProductRequestModule {}
