import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DeliveryChargeService } from './delivery-charge.service';
import {
  CreateDeliveryChargeTierDto,
  UpdateDeliveryChargeTierDto,
} from './dto/delivery-charge.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('delivery-charges')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeliveryChargeController {
  constructor(private readonly deliveryChargeService: DeliveryChargeService) {}

  @Get()
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.READ,
  })
  findAll() {
    return this.deliveryChargeService.findAll();
  }

  @Public()
  @Get('public')
  findPublic() {
    return this.deliveryChargeService.findAll();
  }

  @Get(':id')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.READ,
  })
  findOne(@Param('id') id: string) {
    return this.deliveryChargeService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreateDeliveryChargeTierDto) {
    return this.deliveryChargeService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.UPDATE,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDeliveryChargeTierDto,
  ) {
    return this.deliveryChargeService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.deliveryChargeService.remove(id);
  }
}
