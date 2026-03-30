import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationService {
  constructor(private prisma: PrismaService) {}

  async create(supplierId: string, dto: { rfqId: string; price: number; message?: string; validUntil?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: supplierId } });
    if (!user?.companyId) throw new Error('Cần hồ sơ doanh nghiệp');
    return this.prisma.quotation.create({
      data: {
        rfqId: dto.rfqId,
        supplierId,
        companyId: user.companyId,
        price: dto.price,
        message: dto.message,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        status: 'PENDING',
      },
      include: { company: { select: { id: true, name: true, logo: true } } },
    });
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
    return this.prisma.quotation.update({ where: { id }, data: { status: 'ACCEPTED' } });
  }

  async reject(id: string) {
    return this.prisma.quotation.update({ where: { id }, data: { status: 'REJECTED' } });
  }
}
