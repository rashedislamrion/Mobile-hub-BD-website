import { Module } from '@nestjs/common';
import { FooterSettingsService } from './footer-settings.service';
import { FooterSettingsController } from './footer-settings.controller';
import { FooterController } from './footer.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FooterSettingsController, FooterController],
  providers: [FooterSettingsService],
  exports: [FooterSettingsService],
})
export class FooterSettingsModule {}
