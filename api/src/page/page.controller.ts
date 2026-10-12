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
import { PageService } from './page.service';
import { CreatePageDto, UpdatePageDto } from './dto/page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ContentStatus, ModuleName, PermissionAction } from '@prisma/client';

@Controller('pages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.pageService.findBySlug(slug);
  }

  @Public()
  @Get(':slugOrId')
  findPublicOrOne(@Param('slugOrId') slugOrId: string) {
    // If it looks like a cuid, try to find one or fallback to slug
    return this.pageService.findBySlug(slugOrId);
  }

  @Get()
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  findAll(
    @Query('status') status?: ContentStatus,
    @Query('search') search?: string,
  ) {
    return this.pageService.findAll({ status, search });
  }

  @Post()
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreatePageDto) {
    return this.pageService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdatePageDto) {
    return this.pageService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.pageService.remove(id);
  }
}
