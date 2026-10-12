import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderPaymentMethod, OrderStatus, SaleType } from '@prisma/client';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  quantity: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  unitPrice: number;

  @IsString()
  @IsOptional()
  phoneUnitId?: string;

  @IsString()
  @IsOptional()
  warrantyType?: string;

  @IsString()
  @IsOptional()
  warrantyPeriod?: string;

  @IsString()
  @IsOptional()
  serviceWarranty?: string;

  @IsString()
  @IsOptional()
  warrantyStartDate?: string;

  @IsString()
  @IsOptional()
  warrantyEndDate?: string;

  @IsBoolean()
  @IsOptional()
  isService?: boolean;

  @IsOptional()
  serviceDetails?: any;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsEnum(SaleType)
  @IsOptional()
  saleType?: SaleType = SaleType.POS;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : 0,
  )
  @IsNumber()
  @IsOptional()
  discountAmount?: number = 0;

  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : 0,
  )
  @IsNumber()
  @IsOptional()
  deliveryCharge?: number = 0;

  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : 0,
  )
  @IsNumber()
  @IsOptional()
  paidAmount?: number = 0;

  @IsString()
  @IsOptional()
  shippingAddressId?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  courierPartner?: string;

  @IsEnum(OrderPaymentMethod)
  @IsOptional()
  paymentMethod?: OrderPaymentMethod;

  @IsString()
  @IsOptional()
  note?: string;

  // Diagnostic / Service Job fields
  @IsString()
  @IsOptional()
  device?: string;

  @IsString()
  @IsOptional()
  issueDescription?: string;

  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  @IsNumber()
  @IsOptional()
  serviceCharge?: number;

  @IsString()
  @IsOptional()
  technicianId?: string;

  @IsString()
  @IsOptional()
  saleDate?: string;
}
