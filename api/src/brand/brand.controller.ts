import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';
import { createMulterConfig } from '../common/upload/multer.config';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Public()
  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.CREATE,
  })
  @Post()
  @UseInterceptors(FileInterceptor('logo', createMulterConfig('brands')))
  create(
    @Body() dto: CreateBrandDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.brandService.create(dto, file);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo', createMulterConfig('brands')))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.brandService.update(id, dto, file);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.DELETE,
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
