import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogCategoryDto } from './dto/blog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('blog-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BlogCategoryController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @RequirePermission({
    module: ModuleName.BLOGS,
    action: PermissionAction.READ,
  })
  findAll() {
    return this.blogService.findAllCategories();
  }

  @Post()
  @RequirePermission({
    module: ModuleName.BLOGS,
    action: PermissionAction.CREATE,
  })
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.blogService.createCategory(dto.name);
  }
}
