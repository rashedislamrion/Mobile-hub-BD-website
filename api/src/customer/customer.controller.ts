import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createMulterConfig,
  resolveUploadedFile,
} from '../common/upload/multer.config';
import { CustomerService } from './customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
  ReceivePaymentDto,
  CustomerAddressDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.READ,
  })
  @Get()
  findAll(@Query() query: CustomerQueryDto) {
    return this.customerService.findAll(query);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.CREATE,
  })
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.CREATE,
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('image', createMulterConfig('customers')))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    const relativeUrl =
      (await resolveUploadedFile(file, 'customers')) ||
      `/uploads/customers/${file.filename}`;
    return {
      url: relativeUrl,
      filename: file.filename,
    };
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.READ,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.DELETE,
  })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.customerService.delete(id);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.READ,
  })
  @Get(':id/summary')
  getSummary(
    @Param('id') id: string,
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.customerService.getSummary(id, range, from, to);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.READ,
  })
  @Get(':id/orders')
  getOrders(
    @Param('id') id: string,
    @Query('status') status?: 'active' | 'history',
  ) {
    return this.customerService.getOrders(id, status);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.READ,
  })
  @Get(':id/payments')
  getPayments(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customerService.getPayments(id, page, limit);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.UPDATE,
  })
  @Post(':id/payments')
  receivePayment(@Param('id') id: string, @Body() dto: ReceivePaymentDto) {
    return this.customerService.receivePayment(id, dto);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.READ,
  })
  @Get(':id/activities')
  getActivities(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customerService.getActivities(id, page, limit);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.READ,
  })
  @Get(':id/addresses')
  getAddresses(@Param('id') id: string) {
    return this.customerService.getAddresses(id);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.UPDATE,
  })
  @Post(':id/addresses')
  createAddress(@Param('id') id: string, @Body() dto: CustomerAddressDto) {
    return this.customerService.createAddress(id, dto);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id/addresses/:addressId')
  updateAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() dto: Partial<CustomerAddressDto>,
  ) {
    return this.customerService.updateAddress(id, addressId, dto);
  }

  @RequirePermission({
    module: ModuleName.CUSTOMERS,
    action: PermissionAction.UPDATE,
  })
  @Delete(':id/addresses/:addressId')
  deleteAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.customerService.deleteAddress(id, addressId);
  }
}
