import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RfqService, CreateRfqDto } from './rfq.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('RFQ')
@Controller('rfqs')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RfqController {
  constructor(private rfqService: RfqService) {}

  @Post()
  @Roles(Role.BUYER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Buyer tạo RFQ' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRfqDto) {
    return this.rfqService.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'RFQs của tôi (buyer)' })
  findMy(@CurrentUser('id') userId: string, @Query() q: any) {
    return this.rfqService.findMyRfqs(userId, q.page, q.limit);
  }

  @Get('open')
  @ApiOperation({ summary: 'Danh sách RFQ mở (supplier xem)' })
  findOpen(@Query() q: any) {
    return this.rfqService.findOpen(q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết RFQ' })
  findOne(@Param('id') id: string) {
    return this.rfqService.findOne(id);
  }

  @Patch(':id/close')
  @Roles(Role.BUYER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Đóng RFQ' })
  close(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.rfqService.close(id, userId);
  }
}
