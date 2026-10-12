import { Module } from '@nestjs/common';
import { ServiceLookupService } from './service-lookup.service';
import { ServiceLookupController } from './service-lookup.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceLookupController],
  providers: [ServiceLookupService],
  exports: [ServiceLookupService],
})
export class ServiceLookupModule {}
