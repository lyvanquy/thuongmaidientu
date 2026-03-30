import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => OrderService)) private orderService: OrderService
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
      // COD means just success right away and update order status
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' }});
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' }});
      return { success: true, redirectUrl: `/dashboard/orders/${orderId}?payment=cod_success` };
    }

    // Mock URL for Sandbox Payment Gateway
    const mockUrl = `${process.env.API_URL || 'http://localhost:3001/api'}/payments/webhook?transactionId=${payment.transactionId}&vnp_ResponseCode=00`;
    
    return { 
      success: true, 
      paymentId: payment.id, 
      method,
      amount: order.total,
      redirectUrl: mockUrl // In reality, this redirects to VNPay Gateway
    };
  }

  // Webhook for Server-to-Server communication (Mocking VNPay IPN)
  async handleWebhook(transactionId: string, responseCode: string) {
    const payment = await this.prisma.payment.findFirst({ where: { transactionId }, select: { id: true, orderId: true, status: true } });
    if (!payment) throw new NotFoundException('Transaction không tồn tại');
    
    // Ignore if already processed
    if (payment.status !== 'PENDING') return { message: 'Already processed' };

    if (responseCode === '00') {
      // Success
      await this.prisma.$transaction([
        this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' } }),
        this.prisma.order.update({ where: { id: payment.orderId }, data: { status: 'CONFIRMED' } })
      ]);
      
      const p = await this.prisma.payment.findUnique({ where: { id: payment.id }, include: { order: true } });
      if (p && p.order) {
        this.notificationService.create(p.order.buyerId, 'Thanh toán thành công', `Đơn hàng #${p.order.orderNumber} đã được thanh toán.`, 'ORDER', `/dashboard/orders/${p.order.id}`);
      }
      
      return { code: '00', message: 'Confirm Success' };
    } else {
      // Failed
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      return { code: '02', message: 'Confirm Failed' };
    }
  }
}
