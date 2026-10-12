import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import type { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('customer/register')
  async registerCustomer(
    @Body() dto: RegisterCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user, customer } =
      await this.authService.registerCustomer(dto);
    this.setCustomerRefreshTokenCookie(res, refreshToken);
    return { accessToken, user, customer };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('customer/login')
  async loginCustomer(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user, customer } =
      await this.authService.loginCustomer(dto);
    this.setCustomerRefreshTokenCookie(res, refreshToken);
    return { accessToken, user, customer };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('staff/login')
  async loginStaff(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.loginStaff(dto);
    this.setStaffRefreshTokenCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Public()
  @Post('customer/refresh')
  async refreshCustomerTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      req.cookies?.['customer_refresh_token'] || req.cookies?.['refresh_token'];
    if (!token)
      throw new UnauthorizedException('No customer refresh token provided');
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(token);
    this.setCustomerRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('staff/refresh')
  async refreshStaffTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      req.cookies?.['staff_refresh_token'] || req.cookies?.['refresh_token'];
    if (!token)
      throw new UnauthorizedException('No staff refresh token provided');
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(token);
    this.setStaffRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('refresh')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      req.cookies?.['staff_refresh_token'] ||
      req.cookies?.['customer_refresh_token'] ||
      req.cookies?.['refresh_token'];
    if (!token) throw new UnauthorizedException('No refresh token provided');
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(token);
    if (req.cookies?.['staff_refresh_token']) {
      this.setStaffRefreshTokenCookie(res, refreshToken);
    } else {
      this.setCustomerRefreshTokenCookie(res, refreshToken);
    }
    return { accessToken };
  }

  @Post('customer/logout')
  async customerLogout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('sub') userId: string,
  ) {
    const refreshToken =
      req.cookies?.['customer_refresh_token'] || req.cookies?.['refresh_token'];
    if (refreshToken && userId) {
      await this.authService.logout(refreshToken, userId);
    }
    const isProd = process.env.NODE_ENV === 'production';
    const clearOpts = {
      path: '/',
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
    };
    res.clearCookie('customer_refresh_token', clearOpts);
    res.clearCookie('refresh_token', clearOpts);
    return { success: true };
  }

  @Post('staff/logout')
  async staffLogout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('sub') userId: string,
  ) {
    const refreshToken =
      req.cookies?.['staff_refresh_token'] || req.cookies?.['refresh_token'];
    if (refreshToken && userId) {
      await this.authService.logout(refreshToken, userId);
    }
    const isProd = process.env.NODE_ENV === 'production';
    const clearOpts = {
      path: '/',
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
    };
    res.clearCookie('staff_refresh_token', clearOpts);
    res.clearCookie('refresh_token', clearOpts);
    return { success: true };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('sub') userId: string,
  ) {
    const refreshToken =
      req.cookies?.['staff_refresh_token'] ||
      req.cookies?.['customer_refresh_token'] ||
      req.cookies?.['refresh_token'];
    if (refreshToken && userId) {
      await this.authService.logout(refreshToken, userId);
    }
    const isProd = process.env.NODE_ENV === 'production';
    const clearOpts = {
      path: '/',
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
    };
    res.clearCookie('customer_refresh_token', clearOpts);
    res.clearCookie('staff_refresh_token', clearOpts);
    res.clearCookie('refresh_token', clearOpts);
    return { success: true };
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser('sub') userId: string,
    @CurrentUser('userType') userType: 'STAFF' | 'CUSTOMER',
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, userType, dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  async getMe(
    @CurrentUser('sub') userId: string,
    @CurrentUser('userType') userType: 'STAFF' | 'CUSTOMER',
  ) {
    return this.authService.getMe(userId, userType);
  }

  private setCustomerRefreshTokenCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('customer_refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private setStaffRefreshTokenCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('staff_refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
