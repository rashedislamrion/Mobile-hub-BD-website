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
import { FooterSettingsService } from './footer-settings.service';
import {
  CreateFooterColumnItemDto,
  ReorderFooterColumnItemsDto,
  UpdateFooterColumnItemDto,
} from './dto/footer-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('footer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FooterController {
  constructor(private readonly footerService: FooterSettingsService) {}

  @Public()
  @Get('public')
  getPublicFooter() {
    return this.footerService.getPublicFooter();
  }

  @Get('builder')
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  getBuilderData() {
    return this.footerService.getBuilderData();
  }

  @Patch('columns/reorder')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  reorderColumnItems(@Body() dto: ReorderFooterColumnItemsDto) {
    return this.footerService.reorderColumnItems(dto);
  }

  @Post('columns/:columnKey/items')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.CREATE,
  })
  addItem(
    @Param('columnKey') columnKey: string,
    @Body() dto: CreateFooterColumnItemDto,
  ) {
    return this.footerService.addItem(columnKey, dto);
  }

  @Patch('columns/:columnKey/items/:id/disable')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  disableItem(@Param('id') id: string) {
    return this.footerService.disableItem(id);
  }

  @Patch('columns/:columnKey/items/:id/enable')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  enableItem(@Param('id') id: string) {
    return this.footerService.enableItem(id);
  }

  @Patch('columns/:columnKey/items/:id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  updateItem(
    @Param('columnKey') columnKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateFooterColumnItemDto,
  ) {
    return this.footerService.updateItem(columnKey, id, dto);
  }

  @Delete('columns/:columnKey/items/:id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.DELETE,
  })
  deleteItem(@Param('columnKey') columnKey: string, @Param('id') id: string) {
    return this.footerService.deleteItem(id);
  }
}
