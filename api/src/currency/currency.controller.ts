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
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto/currency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('currencies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.READ,
  })
  findAll() {
    return this.currencyService.findAll();
  }

  @Get(':id')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.READ,
  })
  findOne(@Param('id') id: string) {
    return this.currencyService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreateCurrencyDto) {
    return this.currencyService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.UPDATE,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateCurrencyDto) {
    return this.currencyService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.currencyService.remove(id);
  }
}
