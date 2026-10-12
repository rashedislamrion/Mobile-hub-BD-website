import { Module } from '@nestjs/common';
import { SslcommerzService } from './sslcommerz.service';
import { SslcommerzController } from './sslcommerz.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SslcommerzController],
  providers: [SslcommerzService],
  exports: [SslcommerzService],
})
export class SslcommerzModule {}
