import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, ProductQueryDto } from './dto/product.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPPLIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng sản phẩm mới' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProductDto) {
    return this.productService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm với search & filter' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo ID' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.productService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa sản phẩm' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.productService.remove(id, userId, role);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Duyệt sản phẩm' })
  approve(@Param('id') id: string) {
    return this.productService.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Từ chối sản phẩm' })
  reject(@Param('id') id: string) {
    return this.productService.reject(id);
  }
}
