import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsInt, Min, IsArray } from 'class-validator';
import { NotificationService } from '../notification/notification.service';
import { RFQStatus, NotificationType } from '@prisma/client';

export class CreateRfqDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() targetCompanyId?: string;
  @IsArray() items: Array<{ productName: string; quantity: number; unit?: string; notes?: string }>;
}

@Injectable()
export class RfqService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService
  ) {}

  async create(buyerId: string, dto: CreateRfqDto) {
    const rfq = await this.prisma.rFQ.create({
      data: {
        title: dto.title,
        description: dto.description,
        buyerId,
        targetCompanyId: dto.targetCompanyId,
        status: RFQStatus.OPEN,
        items: {
          create: dto.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
          })),
        },
      },
      include: { items: true, buyer: { select: { id: true, name: true, email: true, company: true } } },
    });

    // Bắn thông báo nếu có targetCompanyId cụ thể
    if (dto.targetCompanyId) {
      const targetUser = await this.prisma.user.findFirst({ where: { companyId: dto.targetCompanyId } });
      if (targetUser) {
        await this.notification.create(
          targetUser.id,
          'Yêu cầu báo giá mới',
          `Bạn nhận được một Yêu cầu Báo Giá từ ${rfq.buyer.name || 'một đối tác'}: "${rfq.title}"`,
          NotificationType.RFQ,
          `/rfqs/${rfq.id}`
        );
      }
    }

    return rfq;
  }

  async findMyRfqs(buyerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where: { buyerId },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, _count: { select: { quotations: true } } },
      }),
      this.prisma.rFQ.count({ where: { buyerId } }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        buyer: { select: { id: true, name: true, email: true, company: { select: { id: true, name: true } } } },
        quotations: {
          include: { company: { select: { id: true, name: true, logo: true } } },
        },
      },
    });

    if (!rfq) throw new NotFoundException('Không tìm thấy tệp Yêu Cầu Báo Giá này');
    return rfq;
  }

  async findOpen(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where: { status: RFQStatus.OPEN },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, buyer: { select: { id: true, name: true } } },
      }),
      this.prisma.rFQ.count({ where: { status: RFQStatus.OPEN } }),
    ]);
    return { items, total, page, limit };
  }

  async close(id: string, buyerId: string) {
    // [Vá lỗi IDOR]: Bắt tay kiểm tra quyền sở hữu
    const rfq = await this.prisma.rFQ.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('Không tìm thấy RFQ');
    if (rfq.buyerId !== buyerId) throw new ForbiddenException('Bạn không có quyền đóng Yêu cầu Báo Giá của người khác.');

    return this.prisma.rFQ.update({
      where: { id },
      data: { status: RFQStatus.CLOSED },
    });
  }
}
