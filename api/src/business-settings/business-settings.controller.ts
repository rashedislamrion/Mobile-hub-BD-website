import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createMulterConfig,
  resolveUploadedFile,
} from '../common/upload/multer.config';
import { BusinessSettingsService } from './business-settings.service';
import {
  UpdateBusinessSettingsDto,
  UpdateBusinessSetupDto,
  UpdateVerificationDto,
} from './dto/business-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('business-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BusinessSettingsController {
  constructor(
    private readonly businessSettingsService: BusinessSettingsService,
  ) {}

  @Public()
  @Get()
  getSettings() {
    return this.businessSettingsService.getSettings();
  }

  @Patch()
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.UPDATE,
  })
  updateSettings(@Body() updateDto: UpdateBusinessSettingsDto) {
    return this.businessSettingsService.updateSettings(updateDto);
  }

  @Get('setup')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.READ,
  })
  getSetup() {
    return this.businessSettingsService.getSetup();
  }

  @Patch('setup')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.UPDATE,
  })
  updateSetup(@Body() dto: UpdateBusinessSetupDto) {
    return this.businessSettingsService.updateSetup(dto);
  }

  @Get('verification')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.READ,
  })
  getVerification() {
    return this.businessSettingsService.getVerification();
  }

  @Patch('verification')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.UPDATE,
  })
  updateVerification(@Body() dto: UpdateVerificationDto) {
    return this.businessSettingsService.updateVerification(dto);
  }

  @Post('upload')
  @RequirePermission({
    module: ModuleName.BUSINESS_SETTINGS,
    action: PermissionAction.UPDATE,
  })
  @UseInterceptors(FileInterceptor('file', createMulterConfig('settings')))
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const url = await resolveUploadedFile(file, 'settings');
    return { url };
  }
}
