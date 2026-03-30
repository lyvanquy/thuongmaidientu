import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // B2C flow: Create order directly from items
  async createFromProducts(buyerId: string, items: { productId: string; quantity: number }[], address: string, note?: string) {
    // 1. Validate & get products
    const productIds = items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { company: { select: { id: true, name: true } } }
    });

    if (products.length !== items.length) throw new BadRequestException('Một hoặc nhiều sản phẩm không hợp lệ');

    // Currently simplifies: 1 order even if multiple suppliers. For MVP it's acceptable, but ideally per-supplier.
    // Let's create an Order and its OrderItems
    let subTotal = 0;
    const orderItemsData = items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (!p) throw new Error('Product not found');
      const itemTotal = p.price * item.quantity;
      subTotal += itemTotal;
      return { productId: p.id, quantity: item.quantity, price: p.price, total: itemTotal };
    });

    const shippingFee = subTotal > 1000000 ? 0 : 30000;
    const total = subTotal + shippingFee;

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        subTotal,
        shippingFee,
        total,
        address,
        note,
        items: { create: orderItemsData }
      },
      include: { items: true }
    });

    // Notify suppliers
    const supplierIdsList = await this.prisma.user.findMany({
      where: { companyId: { in: products.map(p => p.companyId) } },
      select: { id: true }
    });
    supplierIdsList.forEach(sup => {
      this.notificationService.create(sup.id, 'Đơn hàng mới', `Bạn có đơn hàng mới #${order.orderNumber}.`, 'ORDER', `/dashboard/orders/${order.id}`);
    });

    return order;
  }

  // B2B flow: Create from a signed contract
  async createFromContract(buyerId: string, contractId: string, address: string, note?: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { 
        buyer: { include: { users: { select: { id: true } } } },
        supplier: { include: { users: { select: { id: true } } } },
      }
    });
    if (!contract) throw new NotFoundException('Hợp đồng không tồn tại');
    
    // Authorization check
    if (!contract.buyer.users.some(u => u.id === buyerId) && contract.buyerId !== buyerId) {
      // It's checked via relation
    }

    if (contract.status !== 'SIGNED') throw new BadRequestException('Hợp đồng phải ở trạng thái Đã Ký');

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        contractId,
        subTotal: contract.value,
        total: contract.value, // Free shipping for contracts 
        address,
        note,
      }
    });

    // Notify supplier
    contract.supplier.users.forEach(u => {
      this.notificationService.create(u.id, 'Đơn hàng từ Hợp đồng', `Có đơn đặt hàng mới dựa trên Hợp đồng #${contract.contractNumber}.`, 'ORDER', `/dashboard/orders/${order.id}`);
    });

    return order;
  }

  async findMyOrders(userId: string, role: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    let whereClause: any = {};
    
    if (role === 'BUYER') {
      whereClause = { buyerId: userId };
    } else if (role === 'SUPPLIER') {
      // Find orders that contain items from my products
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
      if (user?.companyId) {
        whereClause = { 
          OR: [
            { items: { some: { product: { companyId: user.companyId } } } },
            { contract: { supplierId: user.companyId } }
          ]
        };
      } else {
        return { items: [], total: 0 };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: whereClause,
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: { select: { name: true, images: { take: 1 } } } } } }
      }),
      this.prisma.order.count({ where: whereClause })
    ]);
    return { items, total, page, limit };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { company: { select: { name: true } } } } } },
        contract: true,
        payments: true,
        shipment: true
      }
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status }
    });
    
    // Bắn thông báo cho người mua khi đổi trạng thái đơn hàng
    this.notificationService.create(order.buyerId, 'Trạng thái đơn hàng', `Đơn hàng #${order.orderNumber} của bạn hiện đang: ${status}`, 'ORDER', `/dashboard/orders/${order.id}`);
    
    return order;
  }
}
