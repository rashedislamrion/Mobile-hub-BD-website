import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ServiceLookupService } from './service-lookup.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Get('technicians')
  getTechnicians(@CurrentUser() user?: JwtPayload) {
    return this.serviceLookupService.getTechnicians(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('suppliers')
  getSuppliers() {
    return this.serviceLookupService.getSuppliers();
  }

  @Public()
  @Get('models')
  getModels(@Query('brandId') brandId?: string) {
    return this.serviceLookupService.getModels(brandId);
  }
}
