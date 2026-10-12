import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SslcommerzService } from './sslcommerz.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('payments/sslcommerz')
export class SslcommerzController {
  constructor(private readonly sslcommerzService: SslcommerzService) {}

  @Public()
  @Post('initiate')
  initiate(@Body('orderId') orderId: string) {
    return this.sslcommerzService.initiate(orderId);
  }

  @Public()
  @Post('ipn')
  ipn(@Body() body: any) {
    return this.sslcommerzService.handleIPN(body);
  }

  @Public()
  @Get('success')
  async successGet(@Query() query: any, @Res() res: Response) {
    const redirectUrl = await this.sslcommerzService.handleSuccess(query, {});
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('success')
  async successPost(
    @Query() query: any,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.sslcommerzService.handleSuccess(query, body);
    return res.redirect(redirectUrl);
  }

  @Public()
  @Get('fail')
  async failGet(@Query() query: any, @Res() res: Response) {
    const redirectUrl = await this.sslcommerzService.handleFail(query, {});
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('fail')
  async failPost(@Query() query: any, @Body() body: any, @Res() res: Response) {
    const redirectUrl = await this.sslcommerzService.handleFail(query, body);
    return res.redirect(redirectUrl);
  }

  @Public()
  @Get('cancel')
  async cancelGet(@Query() query: any, @Res() res: Response) {
    const redirectUrl = await this.sslcommerzService.handleCancel(query, {});
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('cancel')
  async cancelPost(
    @Query() query: any,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.sslcommerzService.handleCancel(query, body);
    return res.redirect(redirectUrl);
  }
}
