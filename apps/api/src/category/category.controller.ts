import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy cây danh mục' })
  findAll() { return this.categoryService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết danh mục' })
  findOne(@Param('id') id: string) { return this.categoryService.findOne(id); }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Tạo danh mục' })
  create(@Body() body: any) { return this.categoryService.create(body); }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Cập nhật danh mục' })
  update(@Param('id') id: string, @Body() body: any) { return this.categoryService.update(id, body); }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Xóa danh mục (soft delete)' })
  remove(@Param('id') id: string) { return this.categoryService.remove(id); }
}
