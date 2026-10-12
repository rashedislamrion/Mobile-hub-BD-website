import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { SocialLinkService } from './social-link.service';
import { UpdateSocialLinkDto } from './dto/social-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction, SocialPlatform } from '@prisma/client';

@Controller('social-links')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SocialLinkController {
  constructor(private readonly socialLinkService: SocialLinkService) {}

  @Public()
  @Get()
  findAll() {
    return this.socialLinkService.findAll();
  }

  @Patch(':platform')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  upsertPlatform(
    @Param('platform') platform: SocialPlatform,
    @Body() updateDto: UpdateSocialLinkDto,
  ) {
    return this.socialLinkService.upsertPlatform(platform, updateDto);
  }
}
