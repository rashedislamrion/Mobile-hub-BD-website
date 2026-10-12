import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { FooterSettingsService } from './footer-settings.service';
import { UpdateFooterSettingsDto } from './dto/footer-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('footer-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FooterSettingsController {
  constructor(private readonly footerSettingsService: FooterSettingsService) {}

  @Public()
  @Get()
  getSettings() {
    return this.footerSettingsService.getSettings();
  }

  @Patch()
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  updateSettings(@Body() updateDto: UpdateFooterSettingsDto) {
    return this.footerSettingsService.updateSettings(updateDto);
  }
}
