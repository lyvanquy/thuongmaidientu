import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class ShipmentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => OrderService)) private orderService: OrderService
  ) {}

  async createShipment(orderId: string, carrier: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== 'CONFIRMED') throw new BadRequestException('Chỉ có thể tạo vận đơn khi đã xác nhận/thanh toán');

    // MOCK: Generate Tracking Number
    const trackingCode = `TRK${Date.now()}${(Math.random()*100).toFixed(0)}`;
    
    // Check if shipment exists
    let shipment = await this.prisma.shipment.findFirst({ where: { orderId } });
    if (shipment) throw new BadRequestException('Vận đơn đã tồn tại cho log giao hàng này');

    shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        trackingCode,
        carrier,
        status: 'PENDING'
      }
    });

    // Cập nhật trạng thái đơn sang SHIPPED
    await this.orderService.updateStatus(orderId, 'SHIPPED');

    return shipment;
  }

  async getTracking(trackingCode: string) {
    const shipment = await this.prisma.shipment.findFirst({ 
      where: { trackingCode },
      include: {
        order: { select: { id: true, orderNumber: true, status: true, buyerId: true } }
      }
    });
    
    if (!shipment) throw new NotFoundException('Không tìm thấy vận đơn');

    // Create a mock tracking history
    const shipAny = shipment as any;
    return {
      trackingNumber: shipAny.trackingCode,
      provider: shipAny.carrier,
      status: shipAny.status,
      orderNumber: shipAny.order?.orderNumber,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      history: [
        { time: shipment.createdAt.toISOString(), location: 'Kho lấy hàng', status: 'Đã lấy hàng' },
        { time: new Date(shipment.createdAt.getTime() + 3600000).toISOString(), location: 'Trung tâm phân loại', status: 'Đang xử lý' }
      ]
    };
  }

  async updateShipmentStatus(id: string, newStatus: ShipmentStatus) {
    const shipment = await this.prisma.shipment.update({
      where: { id },
      data: { status: newStatus },
      include: { order: true }
    });

    if (newStatus === 'DELIVERED') {
      await this.orderService.updateStatus(shipment.orderId, 'DELIVERED');
    }

    const shipAny = shipment as any;
    this.notificationService.create(shipAny.order.buyerId, 'Trạng thái giao hàng', `Vận đơn ${shipAny.trackingCode} hiện đang: ${newStatus}`, 'ORDER', `/dashboard/orders/${shipAny.orderId}`);
    
    return shipment;
  }
}
