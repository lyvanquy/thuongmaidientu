import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, productId?: string, companyId?: string) {
    if (productId) {
      const existing = await this.prisma.favorite.findFirst({ where: { userId, productId } });
      if (existing) {
        await this.prisma.favorite.delete({ where: { id: existing.id } });
        return { action: 'removed', type: 'product' };
      }
      await this.prisma.favorite.create({ data: { userId, productId } });
      return { action: 'added', type: 'product' };
    }
    if (companyId) {
      const existing = await this.prisma.favorite.findFirst({ where: { userId, companyId } });
      if (existing) {
        await this.prisma.favorite.delete({ where: { id: existing.id } });
        return { action: 'removed', type: 'company' };
      }
      await this.prisma.favorite.create({ data: { userId, companyId } });
      return { action: 'added', type: 'company' };
    }
  }

  async findMine(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: { include: { images: { where: { isPrimary: true }, take: 1 }, company: { select: { id: true, name: true } } } },
        company: { select: { id: true, name: true, slug: true, logo: true, verificationStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
