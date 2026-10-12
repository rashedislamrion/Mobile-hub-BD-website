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
import { MenuService } from './menu.service';
import {
  AddMenuBuilderItemsDto,
  CreateMenuItemDto,
  ReorderMenuBuilderDto,
  ReorderMenuItemsDto,
  UpdateMenuBuilderItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  MenuType,
  ModuleName,
  PermissionAction,
  StaffStatus,
} from '@prisma/client';

@Controller('menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ============================= BUILDER ROUTES =============================

  @Get('builder')
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  getBuilderData() {
    return this.menuService.getBuilderData();
  }

  @Post('builder/add')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.CREATE,
  })
  addBuilderItems(@Body() dto: AddMenuBuilderItemsDto) {
    return this.menuService.addBuilderItems(dto);
  }

  @Patch('builder/reorder')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  reorderBuilderItems(@Body() dto: ReorderMenuBuilderDto) {
    return this.menuService.reorderBuilderItems(dto);
  }

  @Patch('builder/:id/remove')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  removeBuilderItem(@Param('id') id: string) {
    return this.menuService.removeBuilderItem(id);
  }

  @Patch('builder/:id/restore')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  restoreBuilderItem(@Param('id') id: string) {
    return this.menuService.restoreBuilderItem(id);
  }

  @Patch('builder/:id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  updateBuilderItem(
    @Param('id') id: string,
    @Body() dto: UpdateMenuBuilderItemDto,
  ) {
    return this.menuService.updateBuilderItem(id, dto);
  }

  @Delete('builder/:id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.DELETE,
  })
  deleteBuilderItem(@Param('id') id: string) {
    return this.menuService.deleteBuilderItem(id);
  }

  // ============================= GENERAL / LEGACY ROUTES =============================

  @Public()
  @Get()
  findAllPublicOrAdmin(
    @Query('type') type?: MenuType,
    @Query('status') status?: StaffStatus,
    @Query('search') search?: string,
  ) {
    if (type && !status && !search) {
      return this.menuService.findActiveByType(type);
    }
    return this.menuService.findAll({ menuType: type, status, search });
  }

  @Get('active')
  @Public()
  findActive(@Query('type') type?: MenuType) {
    return this.menuService.findActiveByType(type);
  }

  @Get(':id')
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreateMenuItemDto) {
    return this.menuService.create(createDto);
  }

  @Patch('reorder')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  reorder(@Body() reorderDto: ReorderMenuItemsDto) {
    return this.menuService.reorder(reorderDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateMenuItemDto) {
    return this.menuService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
