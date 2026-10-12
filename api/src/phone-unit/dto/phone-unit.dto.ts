import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PhoneUnitStatus } from '@prisma/client';

export class CheckImeiDto {
  @IsString()
  @IsNotEmpty()
  imei: string;
}

export class CreatePhoneUnitDto {
  @IsString()
  @IsNotEmpty()
  productVariantId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  imei1: string;

  @IsString()
  @IsOptional()
  imei2?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsEnum(PhoneUnitStatus)
  @IsOptional()
  status?: PhoneUnitStatus = PhoneUnitStatus.IN_STOCK;

  @IsOptional()
  buyingPrice?: number;

  @IsOptional()
  sellingPrice?: number;

  @IsString()
  @IsOptional()
  purchaseId?: string;

  @IsString()
  @IsOptional()
  warrantyType?: string;

  @IsString()
  @IsOptional()
  warrantyPeriod?: string;
}
