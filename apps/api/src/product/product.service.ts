import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import slugify from 'slugify';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, locale: 'vi', strict: true }) + '-' + Date.now();
  }

  async create(userId: string, dto: CreateProductDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) throw new ForbiddenException('Bạn cần tạo hồ sơ doanh nghiệp trước');

    return this.prisma.product.create({
      data: {
        ...dto,
        slug: this.makeSlug(dto.name),
        companyId: user.companyId,
        status: 'PENDING',
      },
      include: { category: true, company: { select: { id: true, name: true, logo: true } } },
    });
  }

  async findAll(query: ProductQueryDto) {
    const {
      search, categoryId, type, province, minPrice, maxPrice,
      minMoq, companyId, status = 'APPROVED', featured,
      page = 1, limit = 20, sortBy = 'newest',
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { status };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (province) where.province = province;
    if (minPrice || maxPrice) where.price = {};
    if (minPrice) where.price.gte = +minPrice;
    if (maxPrice) where.price.lte = +maxPrice;
    if (minMoq) where.moq = { gte: +minMoq };
    if (companyId) where.companyId = companyId;
    if (featured === 'true') where.isFeatured = true;

    const orderBy: any =
      sortBy === 'price_asc' ? { price: 'asc' }
      : sortBy === 'price_desc' ? { price: 'desc' }
      : sortBy === 'popular' ? { viewCount: 'desc' }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip, take: +limit, orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          company: { select: { id: true, name: true, slug: true, logo: true, verificationStatus: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        attributes: true,
        category: true,
        company: {
          select: {
            id: true, name: true, slug: true, logo: true,
            verificationStatus: true, province: true,
            _count: { select: { products: true } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    // Increment view count
    await this.prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        attributes: true,
        category: true,
        company: {
          select: {
            id: true, name: true, slug: true, logo: true,
            verificationStatus: true, province: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async update(id: string, userId: string, dto: UpdateProductDto) {
    await this.checkOwner(id, userId);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, role: string) {
    if (role !== 'ADMIN') await this.checkOwner(id, userId);
    return this.prisma.product.delete({ where: { id } });
  }

  async addImage(productId: string, userId: string, url: string, isPrimary = false) {
    await this.checkOwner(productId, userId);
    return this.prisma.productImage.create({ data: { productId, url, isPrimary } });
  }

  async approve(id: string) {
    return this.prisma.product.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async reject(id: string) {
    return this.prisma.product.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  private async checkOwner(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (product?.companyId !== user?.companyId) throw new ForbiddenException('Bạn không có quyền với sản phẩm này');
  }
}
