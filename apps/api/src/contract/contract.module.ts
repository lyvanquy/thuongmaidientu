import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [ContractService],
  controllers: [ContractController],
  exports: [ContractService]
})
export class ContractModule {}
