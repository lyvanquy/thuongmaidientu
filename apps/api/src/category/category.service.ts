import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const cats = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        _count: { select: { products: true } },
      },
    });
    return cats.filter((c) => !c.parentId);
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        _count: { select: { products: true } },
      },
    });
    if (!cat) throw new NotFoundException('Không tìm thấy danh mục');
    return cat;
  }

  async create(data: { name: string; parentId?: string; icon?: string; image?: string; sortOrder?: number }) {
    const slug = slugify(data.name, { lower: true, locale: 'vi', strict: true }) + '-' + Date.now();
    return this.prisma.category.create({ data: { ...data, slug } });
  }

  async update(id: string, data: any) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
