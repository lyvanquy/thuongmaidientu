import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import slugify from 'slugify';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, locale: 'vi', strict: true }) + '-' + Date.now();
  }

  async create(userId: string, dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findFirst({ where: { users: { some: { id: userId } } } });
    if (existing) throw new ConflictException('Bạn đã có hồ sơ doanh nghiệp');

    const company = await this.prisma.company.create({
      data: {
        ...dto,
        slug: this.makeSlug(dto.name),
        users: { connect: { id: userId } },
      },
    });
    // Update user companyId
    await this.prisma.user.update({ where: { id: userId }, data: { companyId: company.id } });
    return company;
  }

  async findAll(query: {
    search?: string; province?: string; verified?: string;
    page?: number; limit?: number;
  }) {
    const { search, province, verified, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (province) where.province = province;
    if (verified === 'true') where.verificationStatus = 'VERIFIED';

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: +limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return { items, total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: 'APPROVED' },
          take: 12,
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
        media: true,
        industries: { include: { category: true } },
        _count: { select: { products: true, users: true } },
      },
    });
    if (!company) throw new NotFoundException('Không tìm thấy doanh nghiệp');
    return company;
  }

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: 'APPROVED' },
          take: 12,
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
        media: true,
        industries: { include: { category: true } },
        _count: { select: { products: true } },
      },
    });
    if (!company) throw new NotFoundException('Không tìm thấy doanh nghiệp');
    return company;
  }

  async update(id: string, userId: string, dto: UpdateCompanyDto) {
    await this.checkOwner(id, userId);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async updateLogo(id: string, userId: string, logoUrl: string) {
    await this.checkOwner(id, userId);
    return this.prisma.company.update({ where: { id }, data: { logo: logoUrl } });
  }

  async updateBanner(id: string, userId: string, bannerUrl: string) {
    await this.checkOwner(id, userId);
    return this.prisma.company.update({ where: { id }, data: { banner: bannerUrl } });
  }

  async verify(id: string, status: string) {
    return this.prisma.company.update({
      where: { id },
      data: { verificationStatus: status as any },
    });
  }

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) throw new ForbiddenException('Bạn không có quyền với doanh nghiệp này');
    
    const companyId = user.companyId;

    const [ordersCount, pendingOrders, activeRfqs, productsCount] = await Promise.all([
      this.prisma.order.count({ where: { items: { some: { product: { companyId } } } } }),
      this.prisma.order.count({ where: { status: 'PENDING', items: { some: { product: { companyId } } } } }),
      this.prisma.rFQ.count({ where: { status: 'OPEN' } }), // Active RFQs in market
      this.prisma.product.count({ where: { companyId } }),
    ]);

    const orders = await this.prisma.order.findMany({
      where: { items: { some: { product: { companyId } } }, status: { in: ['COMPLETED', 'DELIVERED', 'PAID'] } },
      select: { subTotal: true }
    });
    const totalRevenue = orders.reduce((sum, o) => sum + o.subTotal, 0);

    return {
      revenue: totalRevenue,
      totalOrders: ordersCount,
      newOrders: pendingOrders,
      productsCount,
      activeRfqs,
    };
  }

  private async checkOwner(companyId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== companyId) throw new ForbiddenException('Bạn không có quyền với doanh nghiệp này');
  }
}
