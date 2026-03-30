import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createPaymentUrl(orderId: string, method: PaymentMethod = 'BANK_TRANSFER') {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== 'PENDING') throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');

    // Create a un-paid payment record (Mocking creating VNPay transaction code)
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method,
        status: 'PENDING',
        transactionId: `MOCK_TXN_${Date.now()}`
      }
    });

    if (method === 'CASH_ON_DELIVERY') {
      // COD means just success right away and update order status to PAID
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' }});
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', paidAt: new Date() }});
      this.notificationService.create(
        order.buyerId,
        'Thanh toán thành công (COD)',
        `Đơn hàng #${order.orderNumber} đã được xác nhận thanh toán COD.`,
        'ORDER',
        `/orders?payment=cod_success`
      );
      return { success: true, redirectUrl: `/orders?payment=cod_success` };
    }

    // Mock URL cho Cổng Thanh Toán VNPay Sandbox (Frontend UI)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const mockUrl = `${frontendUrl}/checkout/gateway?transactionId=${payment.transactionId}&amount=${order.total}`;
    
    return { 
      success: true, 
      paymentId: payment.id, 
      method,
      amount: order.total,
      redirectUrl: mockUrl // Chuyển hướng người dùng qua giao diện cổng thanh toán
    };
  }

  // Webhook for Server-to-Server communication (Mocking VNPay IPN)
  async handleWebhook(transactionId: string, responseCode: string) {
    const payment = await this.prisma.payment.findFirst({ where: { transactionId }, select: { id: true, orderId: true, status: true } });
    if (!payment) throw new NotFoundException('Transaction không tồn tại');
    
    // Ignore if already processed
    if (payment.status !== 'PENDING') return { message: 'Already processed' };

    if (responseCode === '00') {
      // Success -> Ghi nhận giao dịch thành công (PAID)
      await this.prisma.$transaction([
        this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', paidAt: new Date() } }),
        this.prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } })
      ]);
      
      const order = await this.prisma.order.findUnique({ 
        where: { id: payment.orderId }, 
        select: { id: true, orderNumber: true, buyerId: true },
      });
      if (order) {
        this.notificationService.create(
          order.buyerId,
          'Thanh toán tự động thành công!',
          `Đơn hàng #${order.orderNumber} đã được xác nhận thanh toán thành công.`,
          'PAYMENT',
          `/orders?payment_status=success`
        );
      }
      
      return { code: '00', message: 'Confirm Success' };
    } else {
      // Failed
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      return { code: '02', message: 'Confirm Failed' };
    }
  }
}
