import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ServiceMaterialSourceType } from '@prisma/client';

export class CreateServiceJobDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsOptional()
  technicianId?: string;

  @IsString()
  @IsNotEmpty()
  device: string;

  @IsString()
  @IsNotEmpty()
  issueDescription: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : 0,
  )
  @IsNumber()
  serviceCharge: number;
}

export class AssignTechnicianDto {
  @IsString()
  @IsNotEmpty()
  technicianId: string;
}

export class ServiceJobMaterialDto {
  @IsString()
  @IsNotEmpty()
  partName: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsEnum(ServiceMaterialSourceType)
  @IsOptional()
  sourceType?: ServiceMaterialSourceType;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  sourcedFromName?: string;

  @IsString()
  @IsOptional()
  sourceNote?: string;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  cost: number;

  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : 1,
  )
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  total?: number;
}

export class ServicePaymentDto {
  @IsString()
  @IsNotEmpty()
  method: string;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  amount: number;
}

export class CreateRepairJobDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsOptional()
  referralNumber?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  technicianId?: string;

  @IsString()
  @IsOptional()
  invoiceNo?: string;

  @IsString()
  @IsOptional()
  deviceTypeId?: string;

  @IsString()
  @IsOptional()
  deviceType?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsNotEmpty()
  device: string;

  @IsString()
  @IsOptional()
  issueDescription?: string;

  @IsOptional()
  problems?: any;

  @IsString()
  @IsOptional()
  warrantyPeriod?: string;

  @IsString()
  @IsOptional()
  warrantyStartDate?: string;

  @IsString()
  @IsOptional()
  warrantyEndDate?: string;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  laborCost: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  materialCost: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  totalBill: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  discount?: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  finalAmount: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  dueAmount?: number;

  @IsOptional()
  materials?: ServiceJobMaterialDto[];

  @IsOptional()
  payments?: ServicePaymentDto[];

  @IsOptional()
  paymentDetails?: any;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
