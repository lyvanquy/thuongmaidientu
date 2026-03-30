import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompanyModule } from './company/company.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { UploadModule } from './upload/upload.module';
import { FavoriteModule } from './favorite/favorite.module';
import { RfqModule } from './rfq/rfq.module';
import { QuotationModule } from './quotation/quotation.module';
import { ContractModule } from './contract/contract.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { ShipmentModule } from './shipment/shipment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompanyModule,
    CategoryModule,
    ProductModule,
    UploadModule,
    FavoriteModule,
    RfqModule,
    QuotationModule,
    ContractModule,
    ChatModule,
    NotificationModule,
    OrderModule,
    AdminModule,
    PaymentModule,
    ShipmentModule,
  ],
})
export class AppModule {}
