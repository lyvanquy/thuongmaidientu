import { Module } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { RfqController } from './rfq.controller';

@Module({ providers: [RfqService], controllers: [RfqController], exports: [RfqService] })
export class RfqModule {}
