import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PromoAdStatus,
  PromoApplicableTo,
  PromoDiscountType,
} from '@prisma/client';

export class CreatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(PromoDiscountType)
  discountType: PromoDiscountType;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  discountValue: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxDiscountCap?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  perCustomerLimit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  singleUserLimit?: number;

  @IsEnum(PromoApplicableTo)
  @IsOptional()
  applicableTo?: PromoApplicableTo = PromoApplicableTo.ALL;

  @IsString()
  @IsOptional()
  applicableCategoryId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableProductIds?: string[];

  @IsString()
  @IsNotEmpty()
  validFrom: string;

  @IsString()
  @IsNotEmpty()
  validUntil: string;

  @IsEnum(PromoAdStatus)
  @IsOptional()
  status?: PromoAdStatus = PromoAdStatus.ACTIVE;
}

export class UpdatePromoCodeDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(PromoDiscountType)
  @IsOptional()
  discountType?: PromoDiscountType;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Type(() => Number)
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxDiscountCap?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  perCustomerLimit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  singleUserLimit?: number;

  @IsEnum(PromoApplicableTo)
  @IsOptional()
  applicableTo?: PromoApplicableTo;

  @IsString()
  @IsOptional()
  applicableCategoryId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableProductIds?: string[];

  @IsString()
  @IsOptional()
  validFrom?: string;

  @IsString()
  @IsOptional()
  validUntil?: string;

  @IsEnum(PromoAdStatus)
  @IsOptional()
  status?: PromoAdStatus;
}

export class ValidatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  orderSubtotal?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  orderAmount?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];
}
