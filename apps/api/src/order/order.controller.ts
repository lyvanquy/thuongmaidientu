import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('b2c')
  @ApiOperation({ summary: 'Tạo đơn hàng B2C từ sản phẩm' })
  createB2C(
    @CurrentUser('id') buyerId: string,
    @Body() body: { items: { productId: string; quantity: number }[]; address: string; note?: string }
  ) {
    return this.orderService.createFromProducts(buyerId, body.items, body.address, body.note);
  }

  @Post('b2b/contract/:id')
  @ApiOperation({ summary: 'Tạo đơn hàng B2B từ Hợp đồng' })
  createB2B(
    @CurrentUser('id') buyerId: string,
    @Param('id') contractId: string,
    @Body() body: { address: string; note?: string }
  ) {
    return this.orderService.createFromContract(buyerId, contractId, body.address, body.note);
  }

  @Get('my')
  @ApiOperation({ summary: 'Danh sách đơn hàng của tôi' })
  findMyOrders(
    @CurrentUser() user: any,
    @Query() q: any
  ) {
    return this.orderService.findMyOrders(user.id, user.role, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  getOrder(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus
  ) {
    return this.orderService.updateStatus(id, status);
  }
}
