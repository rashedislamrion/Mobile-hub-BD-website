import { Module } from '@nestjs/common';
import { ThirdPartyConfigService } from './third-party-config.service';
import { ThirdPartyConfigController } from './third-party-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ThirdPartyConfigController],
  providers: [ThirdPartyConfigService],
  exports: [ThirdPartyConfigService],
})
export class ThirdPartyConfigModule {}
