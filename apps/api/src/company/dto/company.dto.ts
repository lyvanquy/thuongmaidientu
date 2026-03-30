import {
  IsString, IsOptional, IsUrl, IsInt, IsEnum, Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiPropertyOptional() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() province?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1900) yearFounded?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() employeeCount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() businessType?: string;
}

export class UpdateCompanyDto extends CreateCompanyDto {}
