import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '@prisma/client';

export class PurchaseOrderItemDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantityOrdered: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  sellingPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  wholesalePrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offerPrice?: number;

  @IsArray()
  @IsOptional()
  phoneUnits?: Array<{
    imei1: string;
    imei2?: string;
    serialNumber?: string;
    condition?: string;
    buyingPrice?: number;
    sellingPrice?: number;
    warrantyType?: string;
    warrantyPeriod?: string;
    warrantyStartDate?: string;
    warrantyEndDate?: string;
  }>;
}

export class PurchaseOrderItemPhoneUnitDto {
  @IsString()
  @IsNotEmpty()
  imei1: string;

  @IsString()
  @IsOptional()
  imei2?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  buyingPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sellingPrice?: number;

  @IsString()
  @IsOptional()
  warrantyType?: string;

  @IsString()
  @IsOptional()
  warrantyPeriod?: string;

  @IsString()
  @IsOptional()
  warrantyStartDate?: string;

  @IsString()
  @IsOptional()
  warrantyEndDate?: string;
}

export class WalletPaymentEntryDto {
  @IsString()
  @IsNotEmpty()
  walletTypeId: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsString()
  @IsOptional()
  orderDate?: string;

  @IsString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus = PurchaseOrderStatus.ORDERED;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  discount?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  shippingCost?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  tax?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  advanceUsed?: number = 0;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WalletPaymentEntryDto)
  walletPayments?: WalletPaymentEntryDto[];

  // Legacy single-wallet fallback
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  amountPaid?: number = 0;

  @IsString()
  @IsOptional()
  walletTypeId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class ReceiveItemDto {
  @IsString()
  @IsOptional()
  purchaseOrderItemId?: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantityReceived: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}

export class ReturnPurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderItemId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantityReturned: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ReturnPurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnPurchaseOrderItemDto)
  items: ReturnPurchaseOrderItemDto[];
}
