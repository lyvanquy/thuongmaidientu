import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';

export class CreateReviewDto {
  productId?: string;
  companyId?: string;
  rating: number; // 1 to 5
  comment?: string;
  images?: string[];
}

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    if (!dto.productId && !dto.companyId) {
      throw new BadRequestException('Bắt buộc phải đánh giá một sản phẩm hoặc công ty');
    }
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        companyId: dto.companyId,
        rating: dto.rating,
        comment: dto.comment,
        images: dto.images || [],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Notify company
    const targetCompanyId = dto.companyId || 
      (dto.productId ? (await this.prisma.product.findUnique({ where: { id: dto.productId } }))?.companyId : null);
    
    if (targetCompanyId) {
       const companyUsers = await this.prisma.user.findMany({ where: { companyId: targetCompanyId } });
       for (const u of companyUsers) {
         try {
           await this.notification.create(
             u.id, 
             'Có đánh giá mới', 
             `${review.user?.name || 'Khách hàng'} đã đánh giá ${dto.rating} sao`, 
             NotificationType.INFO, 
             dto.productId ? `/products/${dto.productId}` : `/companies/${dto.companyId}`
           );
         } catch(e) {}
       }
    }

    return review;
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } }
      }),
      this.prisma.review.count({ where: { productId } }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true }
      })
    ]);
    return { 
      items, total, page, limit, 
      averageRating: aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : 0
    };
  }

  async findByCompany(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { companyId },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } }
      }),
      this.prisma.review.count({ where: { companyId } }),
      this.prisma.review.aggregate({
        where: { companyId },
        _avg: { rating: true }
      })
    ]);
    return { 
      items, total, page, limit, 
      averageRating: aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : 0
    };
  }
}
