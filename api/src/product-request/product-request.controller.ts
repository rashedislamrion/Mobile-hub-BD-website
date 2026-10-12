import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ProductRequestService } from './product-request.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import {
  ApproveProductRequestDto,
  RejectProductRequestDto,
} from './dto/update-product-request.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction, ProductRequestStatus } from '@prisma/client';

@Controller('product-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductRequestController {
  constructor(private readonly productRequestService: ProductRequestService) {}

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.UPDATE,
  })
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('status') status?: ProductRequestStatus,
    @Query('type') type?: 'SENT' | 'RECEIVED',
    @Query('branchId') branchId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productRequestService.findAll(user, {
      search,
      status,
      type,
      branchId,
      page,
      limit,
    });
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.UPDATE,
  })
  @Get('catalog')
  getCatalog(
    @CurrentUser() user: JwtPayload,
    @Query('branchId') branchId: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productRequestService.getCatalog({
      branchId,
      search,
      categoryId,
    });
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.UPDATE,
  })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.productRequestService.findOne(id, user);
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.CREATE,
  })
  @Post()
  create(
    @Body() dto: CreateProductRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productRequestService.create(dto, user);
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveProductRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productRequestService.approve(id, dto, user);
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectProductRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productRequestService.reject(id, dto, user);
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.productRequestService.complete(id, user);
  }
}
