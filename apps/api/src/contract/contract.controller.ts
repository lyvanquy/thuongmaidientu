import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractService, CreateContractDto } from './contract.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Contracts')
@Controller('contracts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ContractController {
  constructor(private service: ContractService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hợp đồng mới (DRAFT)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateContractDto) {
    return this.service.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Danh sách hợp đồng của tôi' })
  findMine(@CurrentUser('id') userId: string, @Query() q: any) {
    return this.service.findMine(userId, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết hợp đồng' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật hợp đồng (chỉ DRAFT)' })
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.update(id, userId, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Gửi hợp đồng chờ duyệt (PENDING)' })
  submit(@Param('id') id: string) { return this.service.submit(id); }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Ký hợp đồng với OTP xác nhận (SIGNED khi đủ 2 bên)' })
  sign(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { otp: string; signatureImage?: string },
  ) {
    return this.service.sign(id, userId, body.otp, body.signatureImage);
  }

  @Post(':id/request-otp')
  @ApiOperation({ summary: 'Yêu cầu mã OTP để ký hợp đồng' })
  requestOtp(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.requestOtp(id, userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Hoàn thành hợp đồng' })
  complete(@Param('id') id: string) { return this.service.complete(id); }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy hợp đồng' })
  cancel(@Param('id') id: string) { return this.service.cancel(id); }
}
