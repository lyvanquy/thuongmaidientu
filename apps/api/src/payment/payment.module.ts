import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { NotificationModule } from '../notification/notification.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [NotificationModule, forwardRef(() => OrderModule)],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
