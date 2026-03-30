import { Controller, Post, Get, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentMethod } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':orderId/create-url')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo URL thanh toán' })
  createPaymentUrl(
    @Param('orderId') orderId: string,
    @Body('method') method: PaymentMethod
  ) {
    return this.paymentService.createPaymentUrl(orderId, method);
  }

  // This should not be guarded as it's a webhook called by gateway
  @Get('webhook')
  @ApiOperation({ summary: 'Mock Webhook IPN xử lý giao dịch' })
  async handleWebhook(
    @Query('transactionId') transactionId: string,
    @Query('vnp_ResponseCode') responseCode: string,
    @Res() res: Response
  ) {
    await this.paymentService.handleWebhook(transactionId, responseCode);
    // Redirect user back to frontend on success/fail
    // For local dev, assuming frontend is localhost:3000
    return res.redirect(`http://localhost:3000/orders?payment_status=${responseCode === '00' ? 'success' : 'failed'}`);
  }
}
