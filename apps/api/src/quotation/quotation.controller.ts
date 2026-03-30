import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotationService } from './quotation.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Quotations')
@Controller('quotations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class QuotationController {
  constructor(private service: QuotationService) {}

  @Post()
  @ApiOperation({ summary: 'Supplier gửi báo giá cho RFQ' })
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Danh sách báo giá mà supplier đã gửi' })
  findMyQuotations(@CurrentUser('id') userId: string) {
    return this.service.findMyQuotations(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách báo giá theo rfqId' })
  findByRfq(@Query('rfqId') rfqId: string) {
    return this.service.findByRfq(rfqId);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Buyer chấp nhận báo giá' })
  accept(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.accept(id, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Buyer từ chối báo giá' })
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
