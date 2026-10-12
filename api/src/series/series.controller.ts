import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.READ,
  })
  @Get()
  findAll(@Query('brandId') brandId?: string) {
    return this.seriesService.findAll(brandId);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.READ,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seriesService.findOne(id);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.CREATE,
  })
  @Post()
  create(@Body() dto: CreateSeriesDto) {
    return this.seriesService.create(dto);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSeriesDto) {
    return this.seriesService.update(id, dto);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.DELETE,
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seriesService.remove(id);
  }
}
