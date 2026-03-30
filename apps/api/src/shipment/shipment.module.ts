import { Module, forwardRef } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { NotificationModule } from '../notification/notification.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [NotificationModule, forwardRef(() => OrderModule)],
  providers: [ShipmentService],
  controllers: [ShipmentController],
  exports: [ShipmentService],
})
export class ShipmentModule {}
