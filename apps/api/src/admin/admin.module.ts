import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CompanyModule } from '../company/company.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [CompanyModule, ProductModule],
  controllers: [AdminController],
})
export class AdminModule {}
