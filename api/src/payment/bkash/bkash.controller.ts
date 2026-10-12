import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BkashService } from './bkash.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('payments/bkash')
export class BkashController {
  constructor(private readonly bkashService: BkashService) {}

  @Public()
  @Post('initiate')
  initiate(@Body('orderId') orderId: string) {
    return this.bkashService.initiate(orderId);
  }

  @Public()
  @Get('callback')
  async callbackGet(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
    @Query('orderId') orderId: string,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.bkashService.handleCallback({
      paymentID,
      status,
      orderId,
    });
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('callback')
  async callbackPost(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
    @Query('orderId') orderId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const pid = paymentID || body?.paymentID;
    const st = status || body?.status;
    const oid = orderId || body?.orderId;
    const redirectUrl = await this.bkashService.handleCallback({
      paymentID: pid,
      status: st,
      orderId: oid,
    });
    return res.redirect(redirectUrl);
  }
}
