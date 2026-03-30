import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPPLIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo hồ sơ doanh nghiệp' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCompanyDto) {
    return this.companyService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách doanh nghiệp (có filter)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'province', required: false })
  @ApiQuery({ name: 'verified', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() query: any) {
    return this.companyService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Xem hồ sơ công ty theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.companyService.findBySlug(slug);
  }

  @Get('my/dashboard-stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPPLIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thống kê dashboard cho nhà cung cấp' })
  getDashboardStats(@CurrentUser('id') userId: string) {
    return this.companyService.getDashboardStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem hồ sơ công ty theo ID' })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật hồ sơ doanh nghiệp' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, userId, dto);
  }
}
