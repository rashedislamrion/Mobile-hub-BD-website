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
import { WantedProductService } from './wanted-product.service';
import { CreateWantedProductDto } from './dto/create-wanted-product.dto';
import { UpdateWantedProductDto } from './dto/update-wanted-product.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('wanted-products')
export class WantedProductController {
  constructor(private readonly wantedProductService: WantedProductService) {}

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.READ,
  })
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.wantedProductService.findAll({
      search,
      status,
      dateFrom,
      dateTo,
      page,
      limit,
    });
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.READ,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wantedProductService.findOne(id);
  }

  @Public()
  @Post()
  create(@Body() dto: CreateWantedProductDto) {
    return this.wantedProductService.create(dto);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWantedProductDto) {
    return this.wantedProductService.update(id, dto);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.DELETE,
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wantedProductService.remove(id);
  }
}
