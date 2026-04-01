import { Controller, Get, Patch, Param, Query, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyService } from '../company/company.service';
import { ProductService } from '../product/product.service';
import { Role } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private companyService: CompanyService,
    private productService: ProductService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Thống kê tổng quan' })
  async getDashboard() {
    const [users, companies, products, orders, rfqs, contracts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.rFQ.count(),
      this.prisma.contract.count(),
    ]);
    const pendingCompanies = await this.prisma.company.count({ where: { verificationStatus: 'PENDING' } });
    const pendingProducts = await this.prisma.product.count({ where: { status: 'PENDING' } });
    return { users, companies, products, orders, rfqs, contracts, pendingCompanies, pendingProducts };
  }

  @Get('companies')
  @ApiOperation({ summary: 'Quản lý doanh nghiệp' })
  getCompanies(@Query() q: any) { return this.companyService.findAll(q); }

  @Patch('companies/:id/verify')
  @ApiOperation({ summary: 'Xác thực doanh nghiệp' })
  verifyCompany(
    @Param('id') id: string, 
    @CurrentUser('id') adminId: string, 
    @Body() body: { status: string; notes?: string }
  ) {
    return this.companyService.verify(adminId, id, body.status || 'VERIFIED', body.notes);
  }

  @Get('products')
  @ApiOperation({ summary: 'Quản lý sản phẩm chờ duyệt' })
  getPendingProducts(@Query() q: any) {
    return this.productService.findAll({ ...q, status: q.status || 'PENDING' });
  }

  @Patch('products/:id/approve')
  @ApiOperation({ summary: 'Duyệt sản phẩm' })
  approveProduct(@Param('id') id: string) { return this.productService.approve(id); }

  @Patch('products/:id/reject')
  @ApiOperation({ summary: 'Từ chối sản phẩm' })
  rejectProduct(@Param('id') id: string) { return this.productService.reject(id); }

  @Get('users')
  @ApiOperation({ summary: 'Danh sách người dùng' })
  async getUsers(@Query() q: any) {
    const page = q.page || 1;
    const limit = q.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip, take: +limit, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, company: { select: { id: true, name: true } } },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total, page: +page, limit: +limit };
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Quản lý hợp đồng' })
  async getContracts(@Query() q: any) {
    const page = q.page || 1;
    const limit = q.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        skip, take: +limit, orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      this.prisma.contract.count(),
    ]);
    return { items, total };
  }

  @Patch('contracts/:id/approve')
  @ApiOperation({ summary: 'Admin phê duyệt hợp đồng, có thể sửa đổi nội dung' })
  async approveContract(@Param('id') id: string, @Body() body: { terms?: string }) {
    return this.prisma.contract.update({
      where: { id },
      data: { 
        status: 'APPROVED',
        ...(body.terms !== undefined && { terms: body.terms })
      },
    });
  }

  @Patch('contracts/:id/reject')
  @ApiOperation({ summary: 'Admin từ chối hợp đồng' })
  async rejectContract(@Param('id') id: string) {
    return this.prisma.contract.update({
      where: { id },
      data: { status: 'CANCELLED' }, // Assuming CANCELLED is used for rejected
    });
  }
}
