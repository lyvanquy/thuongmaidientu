import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShipmentService } from './shipment.service';
import { ShipmentStatus } from '@prisma/client';

@ApiTags('Shipments')
@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post('order/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mã vận đơn cho đơn hàng' })
  createShipment(
    @Param('orderId') orderId: string,
    @Body('provider') provider: string
  ) {
    return this.shipmentService.createShipment(orderId, provider || 'Nội Bộ');
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Tra cứu hành trình đơn hàng public' })
  trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentService.getTracking(trackingNumber);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái giao hàng từ Đơn vị Vận chuyển' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ShipmentStatus
  ) {
    return this.shipmentService.updateShipmentStatus(id, status);
  }
}
