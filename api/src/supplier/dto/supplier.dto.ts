import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StaffStatus, SupplierPaymentTerm } from '@prisma/client';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  productsCategory?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productsSupplied?: string[];

  @IsEnum(SupplierPaymentTerm)
  @IsOptional()
  paymentTerms?: SupplierPaymentTerm = SupplierPaymentTerm.COD;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  advanceBalance?: number = 0;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalDue?: number = 0;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpdateSupplierDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  productsCategory?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productsSupplied?: string[];

  @IsEnum(SupplierPaymentTerm)
  @IsOptional()
  paymentTerms?: SupplierPaymentTerm;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  advanceBalance?: number;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}

export class CreateSupplierPaymentDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Type(() => Number)
  amountPaid?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  extraDiscount?: number;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsNotEmpty()
  walletTypeId: string;

  @IsString()
  @IsOptional()
  purchaseOrderId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  purchaseOrderIds?: string[];

  @IsString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
