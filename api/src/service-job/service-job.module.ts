import { Module } from '@nestjs/common';
import { ServiceJobService } from './service-job.service';
import { ServiceJobController } from './service-job.controller';

@Module({
  controllers: [ServiceJobController],
  providers: [ServiceJobService],
  exports: [ServiceJobService],
})
export class ServiceJobModule {}
