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
import { CountryService } from './country.service';
import { CreateCountryDto, UpdateCountryDto } from './dto/country.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction, StaffStatus } from '@prisma/client';

@Controller('countries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Public()
  @Get()
  findAll(
    @Query('status') status?: StaffStatus,
    @Query('search') search?: string,
  ) {
    return this.countryService.findAll({ status, search });
  }

  @Get(':id')
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  findOne(@Param('id') id: string) {
    return this.countryService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreateCountryDto) {
    return this.countryService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateCountryDto) {
    return this.countryService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.countryService.remove(id);
  }
}
