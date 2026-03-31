import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [QuotationService],
  controllers: [QuotationController],
  exports: [QuotationService]
})
export class QuotationModule {}
