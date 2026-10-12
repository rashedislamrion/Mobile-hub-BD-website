import { Module } from '@nestjs/common';
import { PhoneUnitController } from './phone-unit.controller';
import { PhoneUnitService } from './phone-unit.service';

@Module({
  controllers: [PhoneUnitController],
  providers: [PhoneUnitService],
  exports: [PhoneUnitService],
})
export class PhoneUnitModule {}
