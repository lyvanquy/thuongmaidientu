import { Controller, Post, Get, Body, Param, Query, UseGuards, Res, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentMethod } from '@prisma/client';
import { Response, Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':orderId/create-url')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo URL thanh toán VNPAY' })
  createPaymentUrl(
    @Param('orderId') orderId: string,
    @Body('method') method: PaymentMethod,
    @Req() req: Request
  ) {
    const ipAddr = req.headers['x-forwarded-for'] ||
                   req.socket.remoteAddress ||
                   '127.0.0.1';
    return this.paymentService.createPaymentUrl(orderId, method, ipAddr as string);
  }

  @Get('vnpay-return')
  @ApiOperation({ summary: 'VNPAY Return - Xử lý chuyển hướng người dùng khi thanh toán xong' })
  async vnpayReturn(@Query() vnpayParams: any, @Res() res: Response) {
    const responseCode = vnpayParams['vnp_ResponseCode'];
    // Chuyển hướng người dùng về Frontend app
    // Mã 00 là giao dịch thành công theo chuẩn VNPAY
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/orders?payment_status=${responseCode === '00' ? 'success' : 'failed'}`);
  }

  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'VNPAY IPN - Webhook gọi ngầm từ VNPAY để update DB bảo mật' })
  async vnpayIpn(@Query() vnpayParams: any) {
    return this.paymentService.handleVnpayIpn(vnpayParams);
  }
}
