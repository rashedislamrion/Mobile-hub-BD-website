import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import {
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
  ValidatePromoCodeDto,
} from './dto/promo-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction, PromoAdStatus } from '@prisma/client';

@Controller('promo-codes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Public()
  @Post('validate')
  validatePromoCode(@Body() validateDto: ValidatePromoCodeDto) {
    return this.promoCodeService.validatePromoCode(validateDto);
  }

  @Get()
  @RequirePermission({
    module: ModuleName.PROMO_CODE,
    action: PermissionAction.READ,
  })
  findAll(
    @Query('status') status?: PromoAdStatus,
    @Query('search') search?: string,
  ) {
    return this.promoCodeService.findAll({ status, search });
  }

  @Get(':id')
  @RequirePermission({
    module: ModuleName.PROMO_CODE,
    action: PermissionAction.READ,
  })
  findOne(@Param('id') id: string) {
    return this.promoCodeService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.PROMO_CODE,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreatePromoCodeDto) {
    return this.promoCodeService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.PROMO_CODE,
    action: PermissionAction.UPDATE,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdatePromoCodeDto) {
    return this.promoCodeService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.PROMO_CODE,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.promoCodeService.remove(id);
  }
}
