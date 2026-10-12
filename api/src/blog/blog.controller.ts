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
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createMulterConfig,
  resolveUploadedFile,
} from '../common/upload/multer.config';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ContentStatus, ModuleName, PermissionAction } from '@prisma/client';

@Controller('blogs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  findPublished(
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.blogService.findPublished({ tag, search, page, limit });
  }

  @Get('admin')
  @RequirePermission({
    module: ModuleName.BLOGS,
    action: PermissionAction.READ,
  })
  findAdminAll(
    @Query('status') status?: ContentStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.blogService.findAdminAll({ status, search, page, limit });
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.BLOGS,
    action: PermissionAction.CREATE,
  })
  @UseInterceptors(FileInterceptor('image', createMulterConfig('blogs')))
  async create(
    @Body() createDto: CreateBlogDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createDto.featuredImage =
        (await resolveUploadedFile(file, 'blogs')) ||
        `/uploads/blogs/${file.filename}`;
    }
    return this.blogService.create(createDto, req.user?.sub);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.BLOGS,
    action: PermissionAction.UPDATE,
  })
  @UseInterceptors(FileInterceptor('image', createMulterConfig('blogs')))
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBlogDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateDto.featuredImage =
        (await resolveUploadedFile(file, 'blogs')) ||
        `/uploads/blogs/${file.filename}`;
    }
    return this.blogService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.BLOGS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
