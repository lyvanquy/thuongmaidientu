import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreateRfqDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() targetCompanyId?: string;
  @IsArray() items: Array<{ productName: string; quantity: number; unit?: string; notes?: string }>;
}

@Injectable()
export class RfqService {
  constructor(private prisma: PrismaService) {}

  async create(buyerId: string, dto: CreateRfqDto) {
    return this.prisma.rFQ.create({
      data: {
        title: dto.title,
        description: dto.description,
        buyerId,
        targetCompanyId: dto.targetCompanyId,
        status: 'OPEN',
        items: {
          create: dto.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
          })),
        },
      },
      include: { items: true, buyer: { select: { id: true, name: true, email: true } } },
    });
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
    return this.prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        buyer: { select: { id: true, name: true, email: true, company: { select: { id: true, name: true } } } },
        quotations: {
          include: { company: { select: { id: true, name: true, logo: true } } },
        },
      },
    });
  }

  async findOpen(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where: { status: 'OPEN' },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, buyer: { select: { id: true, name: true } } },
      }),
      this.prisma.rFQ.count({ where: { status: 'OPEN' } }),
    ]);
    return { items, total, page, limit };
  }

  async close(id: string, buyerId: string) {
    return this.prisma.rFQ.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }
}
