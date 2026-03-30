import { IsString, IsOptional, IsNumber, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priceMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) moq?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() province?: string;
  @ApiProperty({ enum: ProductType }) @IsEnum(ProductType) type: ProductType;
  @ApiProperty() @IsString() categoryId: string;
}

export class UpdateProductDto extends CreateProductDto {}

export class ProductQueryDto {
  search?: string;
  categoryId?: string;
  type?: ProductType;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  companyId?: string;
  status?: string;
  featured?: string;
  page?: number;
  limit?: number;
  sortBy?: string; // 'newest' | 'price_asc' | 'price_desc' | 'popular'
}
