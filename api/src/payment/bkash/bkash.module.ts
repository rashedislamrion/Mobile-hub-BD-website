import { Module } from '@nestjs/common';
import { BkashService } from './bkash.service';
import { BkashController } from './bkash.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BkashController],
  providers: [BkashService],
  exports: [BkashService],
})
export class BkashModule {}
