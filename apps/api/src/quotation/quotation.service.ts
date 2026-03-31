import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { QuotationStatus, RFQStatus, NotificationType } from '@prisma/client';

@Injectable()
export class QuotationService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService
  ) {}

  async create(supplierId: string, dto: { rfqId: string; price: number; message?: string; validUntil?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: supplierId } });
    if (!user?.companyId) {
      throw new ForbiddenException('Bạn cần tạo hồ sơ doanh nghiệp trước khi gửi báo giá');
    }

    const rfq = await this.prisma.rFQ.findUnique({ where: { id: dto.rfqId } });
    if (!rfq) throw new NotFoundException('Yêu cầu báo giá không tồn tại');
    if (rfq.status === RFQStatus.CLOSED || rfq.status === RFQStatus.CANCELLED) {
      throw new BadRequestException('Yêu cầu báo giá này đã đóng, bạn không thể gửi thêm bảng giá.');
    }
    if (rfq.buyerId === supplierId) {
      throw new BadRequestException('Bạn không thể gửi báo giá cho chính yêu cầu của mình.');
    } // Prevent quoting own RFQ

    const quotation = await this.prisma.quotation.create({
      data: {
        rfqId: dto.rfqId,
        supplierId,
        companyId: user.companyId,
        price: dto.price,
        message: dto.message,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        status: QuotationStatus.PENDING,
      },
      include: { company: { select: { id: true, name: true, logo: true } } },
    });

    // Bắn thông báo cho người mở RFQ
    await this.notification.create(
       rfq.buyerId,
       'Có báo giá mới tời RFQ',
       `Doanh nghiệp ${quotation.company.name} vừa gửi cho bạn một mức giá mới là ${dto.price.toLocaleString('vi-VN')} VND.`,
       NotificationType.QUOTATION,
       `/rfqs/${rfq.id}`
    );

    return quotation;
  }

  async findMyQuotations(supplierId: string) {
    return this.prisma.quotation.findMany({
      where: { supplierId },
      include: { 
        rfq: {
          select: { id: true, title: true, status: true, buyer: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByRfq(rfqId: string) {
    return this.prisma.quotation.findMany({
      where: { rfqId },
      include: { company: { select: { id: true, name: true, logo: true, verificationStatus: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(id: string, buyerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: { rfq: true, supplier: true }
      });
      if (!quotation) throw new NotFoundException('Báo giá không tồn tại');

      // [Vá lỗ hổng IDOR]: Kiểm tra người chấp nhận có phải chủ RFQ gốc không
      if (quotation.rfq.buyerId !== buyerId) {
        throw new ForbiddenException('Bạn không có quyền chấp nhận báo giá của RFQ do người khác tạo.');
      }

      if (quotation.rfq.status !== RFQStatus.OPEN && quotation.rfq.status !== RFQStatus.NEGOTIATING) {
        throw new BadRequestException('RFQ gốc không ở trạng thái sẵn sàng nghiệm thu.');
      }

      // Xử lý báo giá -> ACCEPTED
      const updatedQuotation = await tx.quotation.update({
        where: { id },
        data: { status: QuotationStatus.ACCEPTED }
      });

      // Tự động đóng RFQ tương ứng
      await tx.rFQ.update({
        where: { id: quotation.rfqId },
        data: { status: RFQStatus.CLOSED }
      });

      // Từ chối (Rejection ngầm) các quotation khác chưa được duyệt của RFQ này
      await tx.quotation.updateMany({
        where: { rfqId: quotation.rfqId, id: { not: id }, status: QuotationStatus.PENDING },
        data: { status: QuotationStatus.REJECTED }
      });

      // Push Notification báo hỉ cho đối tác Supplier
      await this.notification.create(
        quotation.supplierId,
        'Báo giá đã được chấp nhận!',
        `Xin chúc mừng, bản báo giá trị giá ${quotation.price.toLocaleString('vi-VN')} VND cho RFQ "${quotation.rfq.title}" đã được chấp nhận! Hệ thống đã tự động khép kín RFQ.`,
        NotificationType.QUOTATION,
        `/quotations/${quotation.id}` // Link hờ
      );

      return updatedQuotation;
    });
  }

  async reject(id: string, buyerId: string) {
    const quotation = await this.prisma.quotation.findUnique({ include: { rfq: true }, where: { id } });
    if (!quotation) throw new NotFoundException('Báo giá không tồn tại');

    // Chống Auth IDOR
    if (quotation.rfq.buyerId !== buyerId) {
      throw new ForbiddenException('Bạn không có quyền từ chối báo giá của người khác.');
    }

    const rejetedQuote = await this.prisma.quotation.update({ where: { id }, data: { status: QuotationStatus.REJECTED } });

    await this.notification.create(
        quotation.supplierId,
        'Báo giá đã bị từ chối phụ thuộc',
        `Rất tiếc, báo giá của bạn cho RFQ "${quotation.rfq.title}" không được đối tác chấp nhận.`,
        NotificationType.QUOTATION,
        `/quotations/${quotation.id}`
    );

    return rejetedQuote;
  }
}
