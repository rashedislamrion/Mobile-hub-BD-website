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
import { WastedProductService } from './wasted-product.service';
import { CreateWastedProductDto } from './dto/create-wasted-product.dto';
import { UpdateWastedProductDto } from './dto/update-wasted-product.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('wasted-products')
export class WastedProductController {
  constructor(private readonly wastedProductService: WastedProductService) {}

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.READ,
  })
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('reason') reason?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.wastedProductService.findAll({
      search,
      branchId,
      reason,
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
    return this.wastedProductService.findOne(id);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.CREATE,
  })
  @Post()
  create(
    @Body() dto: CreateWastedProductDto,
    @CurrentUser('sub') staffId: string,
  ) {
    return this.wastedProductService.create(dto, staffId);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWastedProductDto) {
    return this.wastedProductService.update(id, dto);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.DELETE,
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wastedProductService.remove(id);
  }
}
