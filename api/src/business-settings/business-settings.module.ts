import { Module } from '@nestjs/common';
import { BusinessSettingsService } from './business-settings.service';
import { BusinessSettingsController } from './business-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
