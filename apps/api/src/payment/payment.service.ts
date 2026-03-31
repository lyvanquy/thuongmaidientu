import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

// ─────────────────────────────────────────────────────────
// Helper: Format date thành YYYYMMDDHHmmss (chuẩn VNPAY)
// ─────────────────────────────────────────────────────────
function formatVnpDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// ─────────────────────────────────────────────────────────
// Helper: Tạo HMAC-SHA512 signature (chuẩn VNPAY)
// ─────────────────────────────────────────────────────────
function hmacSha512(secret: string, data: string): string {
  return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
}

// ─────────────────────────────────────────────────────────
// Helper: Sort param object theo key (A-Z) và stringify
// ─────────────────────────────────────────────────────────
function sortedQueryString(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((acc, k) => { acc[k] = params[k]; return acc; }, {});
  return querystring.stringify(sorted);
}

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // Tạo URL Thanh toán VNPAY
  // ─────────────────────────────────────────────────────────
  async createPaymentUrl(orderId: string, method: PaymentMethod = 'BANK_TRANSFER', ipAddr = '127.0.0.1') {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== 'PENDING') throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');

    // Tạo mã Transaction dùng cho VNPAY (TxnRef)
    const txnRef = `${order.orderNumber}-${Date.now()}`;

    // Ghi nhận Payment record trước khi redirect
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method,
        status: 'PENDING',
        transactionId: txnRef,
      },
    });

    // ── COD: Xác nhận ngay, không cần cổng thanh toán ──
    if (method === 'CASH_ON_DELIVERY') {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', paidAt: new Date() } });
      this.notificationService.create(
        order.buyerId,
        'Đặt hàng thành công (COD)',
        `Đơn hàng #${order.orderNumber} đã được xác nhận - Thanh toán khi nhận hàng.`,
        'ORDER',
        `/orders`,
      );
      return { success: true, redirectUrl: `/orders?payment_status=cod_success` };
    }

    // ── VNPAY: Xây dựng URL Thanh toán theo giao thức chuẩn ──
    const vnpTmnCode   = process.env.VNP_TMNCODE   || 'DEMOV210';
    const vnpHashSecret = process.env.VNP_HASHSECRET || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
    const vnpUrl        = process.env.VNP_URL        || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl     = process.env.VNP_RETURN_URL || 'http://localhost:3001/api/payments/vnpay-return';

    const date = new Date();
    const createDate = formatVnpDate(date);
    // Expire sau 15 phút
    const expireDate = formatVnpDate(new Date(date.getTime() + 15 * 60 * 1000));

    // VNPAY yêu cầu số tiền x100 (không có dấu phẩy)
    const vnpAmount = Math.round(order.total * 100).toString();

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpTmnCode,
      vnp_Amount: vnpAmount,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr.toString().replace('::1', '127.0.0.1').replace('::ffff:', ''),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Tạo chữ ký hashed
    const signData = sortedQueryString(vnpParams);
    const secureHash = hmacSha512(vnpHashSecret, signData);

    // Gắn chữ ký vào URL cuối cùng
    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    return {
      success: true,
      paymentId: payment.id,
      transactionId: txnRef,
      method,
      amount: order.total,
      redirectUrl: paymentUrl,
    };
  }

  // ─────────────────────────────────────────────────────────
  // Xử lý IPN Webhook từ VNPAY (Server-to-Server)
  // VNPAY gọi ngầm endpoint này sau khi giao dịch xong.
  // Phải verify chữ ký để đảm bảo tính toàn vẹn.
  // ─────────────────────────────────────────────────────────
  async handleVnpayIpn(vnpayParams: Record<string, string>) {
    const vnpHashSecret = process.env.VNP_HASHSECRET || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';

    // 1. Tách chữ ký ra khỏi params
    const secureHash = vnpayParams['vnp_SecureHash'];
    const { vnp_SecureHash, vnp_SecureHashType, ...paramsWithoutHash } = vnpayParams;

    // 2. Tạo lại chữ ký để so sánh
    const signData = sortedQueryString(paramsWithoutHash);
    const generatedHash = hmacSha512(vnpHashSecret, signData);

    // 3. So sánh chữ ký
    if (generatedHash !== secureHash) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const txnRef      = vnpayParams['vnp_TxnRef'];
    const responseCode = vnpayParams['vnp_ResponseCode'];

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: txnRef },
    });

    if (!payment) return { RspCode: '01', Message: 'Order not found' };
    if (payment.status !== 'PENDING') return { RspCode: '02', Message: 'Order already confirmed' };

    if (responseCode === '00') {
      // ── Giao dịch thành công ──
      await this.prisma.$transaction([
        this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', paidAt: new Date() } }),
        this.prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } }),
      ]);

      const order = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        select: { id: true, orderNumber: true, buyerId: true },
      });
      if (order) {
        this.notificationService.create(
          order.buyerId,
          '💳 Thanh toán VNPAY thành công!',
          `Đơn hàng #${order.orderNumber} đã được xác nhận. Cảm ơn bạn đã mua hàng tại TradeMart!`,
          'PAYMENT',
          `/orders`,
        );
      }

      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      // ── Giao dịch thất bại ──
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      return { RspCode: '00', Message: 'Confirm Failed' };
    }
  }

  // Legacy method - kept for backward compatibility
  async handleWebhook(transactionId: string, responseCode: string) {
    return this.handleVnpayIpn({ vnp_TxnRef: transactionId, vnp_ResponseCode: responseCode, vnp_SecureHash: '' });
  }
}
