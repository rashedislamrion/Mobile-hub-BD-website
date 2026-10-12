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
import { WalletService } from './wallet.service';
import {
  CreateWalletTypeDto,
  UpdateWalletTypeDto,
  CreatePurposeDto,
  UpdatePurposeDto,
  CreateWalletTransactionDto,
  CreateStaffPaymentDto,
} from './dto/wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ModuleName, PermissionAction, WalletTxnType } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ============================= WALLET TYPES =============================

  @Get('wallet-types/summary')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  getWalletTypesSummary() {
    return this.walletService.getWalletTypesSummary();
  }

  @Get('wallet-types')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  findAllWalletTypes() {
    return this.walletService.findAllWalletTypes();
  }

  @Get('wallets')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  findAllWallets(@Query('branchId') branchId?: string) {
    return this.walletService.findAllWalletTypes();
  }

  @Get('wallet-types/:id')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  findOneWalletType(@Param('id') id: string) {
    return this.walletService.findOneWalletType(id);
  }

  @Patch('wallet-types/:id/toggle-active')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.UPDATE,
  })
  toggleActiveWalletType(@Param('id') id: string) {
    return this.walletService.toggleActiveWalletType(id);
  }

  @Post('wallet-types')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.CREATE,
  })
  createWalletType(@Body() dto: CreateWalletTypeDto) {
    return this.walletService.createWalletType(dto);
  }

  @Patch('wallet-types/:id')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.UPDATE,
  })
  updateWalletType(@Param('id') id: string, @Body() dto: UpdateWalletTypeDto) {
    return this.walletService.updateWalletType(id, dto);
  }

  @Delete('wallet-types/:id')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.DELETE,
  })
  removeWalletType(@Param('id') id: string) {
    return this.walletService.removeWalletType(id);
  }

  // ============================= PURPOSES =============================

  @Get('purposes')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  findAllPurposes() {
    return this.walletService.findAllPurposes();
  }

  @Get('purposes/:id')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  findOnePurpose(@Param('id') id: string) {
    return this.walletService.findOnePurpose(id);
  }

  @Post('purposes')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.CREATE,
  })
  createPurpose(@Body() dto: CreatePurposeDto) {
    return this.walletService.createPurpose(dto);
  }

  @Patch('purposes/:id')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.UPDATE,
  })
  updatePurpose(@Param('id') id: string, @Body() dto: UpdatePurposeDto) {
    return this.walletService.updatePurpose(id, dto);
  }

  @Delete('purposes/:id')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.DELETE,
  })
  removePurpose(@Param('id') id: string) {
    return this.walletService.removePurpose(id);
  }

  // ============================= TRANSACTIONS =============================

  @Get('wallet-transactions/transfers')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  findAllTransfers(
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.findAllTransfers({
      search,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('wallet-transactions/transfer')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.CREATE,
  })
  transferFunds(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.walletService.transferFunds(dto, user.sub);
  }

  @Get('wallet-transactions/staff-payments')
  @RequirePermission({ module: ModuleName.HRM, action: PermissionAction.READ })
  findAllStaffPayments(
    @Query('walletTypeId') walletTypeId?: string,
    @Query('month') month?: string,
    @Query('payType') payType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.findAllStaffPayments({
      walletTypeId,
      month,
      payType,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('wallet-transactions/staff-payment')
  @RequirePermission({
    module: ModuleName.HRM,
    action: PermissionAction.CREATE,
  })
  createStaffPayment(
    @Body() dto: CreateStaffPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.walletService.createStaffPayment(dto, user.sub);
  }

  @Get('wallet-transactions')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.READ,
  })
  findAllTransactions(
    @Query('walletType') walletType?: string,
    @Query('purpose') purpose?: string,
    @Query('type') type?: WalletTxnType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.findAllTransactions({
      walletType,
      purpose,
      type,
      dateFrom,
      dateTo,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('wallet-transactions')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.CREATE,
  })
  createTransaction(
    @Body() dto: CreateWalletTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.walletService.createTransaction(dto, user.sub);
  }

  @Post('wallets/:id/transactions')
  @RequirePermission({
    module: ModuleName.WALLET,
    action: PermissionAction.CREATE,
  })
  createWalletTransaction(
    @Param('id') id: string,
    @Body() dto: CreateWalletTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.walletService.createTransaction(
      { ...dto, walletTypeId: id },
      user.sub,
    );
  }
}
