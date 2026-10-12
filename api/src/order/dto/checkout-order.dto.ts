import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderPaymentMethod } from '@prisma/client';

export class CheckoutOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  unitPrice?: number;
}

export class GuestInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  city?: string;
}

export class ShippingAddressInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class CheckoutOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutOrderItemDto)
  items: CheckoutOrderItemDto[];

  @IsString()
  @IsOptional()
  shippingAddressId?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guestInfo?: GuestInfoDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressInputDto)
  shippingAddress?: ShippingAddressInputDto;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsEnum(OrderPaymentMethod)
  paymentMethod: OrderPaymentMethod;

  @IsString()
  @IsOptional()
  deliveryType?: 'STANDARD' | 'EXPRESS';

  @IsString()
  @IsOptional()
  deliveryZone?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  deliveryCharge?: number;

  @IsString()
  @IsOptional()
  orderNotes?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
