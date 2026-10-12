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
import { SupplierService } from './supplier.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateSupplierPaymentDto,
} from './dto/supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ModuleName, PermissionAction, StaffStatus } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  // ============================= SUPPLIERS =============================

  @Get('suppliers')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.READ,
  })
  findAllSuppliers(
    @Query('status') status?: StaffStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supplierService.findAllSuppliers({
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('suppliers/:id/advance')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.READ,
  })
  async getSupplierAdvance(@Param('id') id: string) {
    const supplier = await this.supplierService.findOneSupplier(id);
    return {
      advanceBalance: Number(supplier.advanceBalance || 0),
      totalDue: Number(supplier.totalDue || 0),
    };
  }

  @Get('suppliers/:id')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.READ,
  })
  findOneSupplier(@Param('id') id: string) {
    return this.supplierService.findOneSupplier(id);
  }

  @Post('suppliers')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.CREATE,
  })
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.supplierService.createSupplier(dto);
  }

  @Patch('suppliers/:id')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.UPDATE,
  })
  updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.DELETE,
  })
  removeSupplier(@Param('id') id: string) {
    return this.supplierService.removeSupplier(id);
  }

  // ============================= SUPPLIER PAYMENTS =============================

  @Get('supplier-payments')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.READ,
  })
  findAllPayments(
    @Query('supplier') supplier?: string,
    @Query('method') method?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supplierService.findAllPayments({
      supplier,
      method,
      dateFrom,
      dateTo,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('supplier-payments')
  @RequirePermission({
    module: ModuleName.SUPPLIERS,
    action: PermissionAction.CREATE,
  })
  createPayment(
    @Body() dto: CreateSupplierPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.supplierService.createPayment(dto, user.sub);
  }
}
