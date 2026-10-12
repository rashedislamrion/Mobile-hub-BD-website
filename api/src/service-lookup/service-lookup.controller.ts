import { Controller, Get } from '@nestjs/common';
import { ServiceLookupService } from './service-lookup.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('service-lookups')
export class ServiceLookupController {
  constructor(private readonly serviceLookupService: ServiceLookupService) {}

  @Public()
  @Get('device-types')
  getDeviceTypes() {
    return this.serviceLookupService.getDeviceTypes();
  }

  @Public()
  @Get('problem-types')
  getProblemTypes() {
    return this.serviceLookupService.getProblemTypes();
  }

  @Public()
  @Get('warranty-periods')
  getWarrantyPeriods() {
    return this.serviceLookupService.getWarrantyPeriods();
  }
}
