import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ThirdPartyConfigService } from './third-party-config.service';
import {
  UpdateFirebaseConfigDto,
  UpdateMailConfigDto,
  UpdatePaymentGatewayDto,
  UpdateRecaptchaConfigDto,
  UpdateSmsConfigDto,
} from './dto/third-party-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  ModuleName,
  PaymentGatewayName,
  PermissionAction,
} from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ThirdPartyConfigController {
  constructor(private readonly configService: ThirdPartyConfigService) {}

  // ==================== PAYMENT GATEWAYS ====================

  @Public()
  @Get('payment-gateways/public')
  getPublicPaymentGateways() {
    return this.configService.getPublicPaymentGateways();
  }

  @Get('payment-gateways')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.READ,
  })
  getPaymentGateways() {
    return this.configService.getPaymentGateways();
  }

  @Patch('payment-gateways/:gateway')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.UPDATE,
  })
  updatePaymentGateway(
    @Param('gateway') gateway: PaymentGatewayName,
    @Body() updateDto: UpdatePaymentGatewayDto,
  ) {
    return this.configService.updatePaymentGateway(gateway, updateDto);
  }

  // ==================== SMS CONFIG ====================

  @Get('sms-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.READ,
  })
  getSmsConfig() {
    return this.configService.getSmsConfig();
  }

  @Patch('sms-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.UPDATE,
  })
  updateSmsConfig(@Body() updateDto: UpdateSmsConfigDto) {
    return this.configService.updateSmsConfig(updateDto);
  }

  // ==================== MAIL CONFIG ====================

  @Get('mail-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.READ,
  })
  getMailConfig() {
    return this.configService.getMailConfig();
  }

  @Patch('mail-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.UPDATE,
  })
  updateMailConfig(@Body() updateDto: UpdateMailConfigDto) {
    return this.configService.updateMailConfig(updateDto);
  }

  // ==================== FIREBASE CONFIG ====================

  @Get('firebase-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.READ,
  })
  getFirebaseConfig() {
    return this.configService.getFirebaseConfig();
  }

  @Patch('firebase-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.UPDATE,
  })
  updateFirebaseConfig(@Body() updateDto: UpdateFirebaseConfigDto) {
    return this.configService.updateFirebaseConfig(updateDto);
  }

  // ==================== RECAPTCHA CONFIG ====================

  @Get('recaptcha-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.READ,
  })
  getRecaptchaConfig() {
    return this.configService.getRecaptchaConfig();
  }

  @Patch('recaptcha-config')
  @RequirePermission({
    module: ModuleName.THIRD_PARTY_CONFIG,
    action: PermissionAction.UPDATE,
  })
  updateRecaptchaConfig(@Body() updateDto: UpdateRecaptchaConfigDto) {
    return this.configService.updateRecaptchaConfig(updateDto);
  }
}
