import { Module } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { RfqController } from './rfq.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [RfqService],
  controllers: [RfqController],
  exports: [RfqService]
})
export class RfqModule {}
