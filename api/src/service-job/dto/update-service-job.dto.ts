import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ServiceMaterialSourceType, ServiceJobStatus } from '@prisma/client';
import { ServiceJobMaterialDto } from './create-service-job.dto';

export class UpdateServiceJobDto {
  @IsEnum(ServiceJobStatus)
  @IsOptional()
  status?: ServiceJobStatus;

  @IsString()
  @IsOptional()
  device?: string;

  @IsString()
  @IsOptional()
  issueDescription?: string;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  laborCost?: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  discount?: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  advancePayment?: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  dueAmount?: number;

  @Transform(({ value }) => Number(value) || 0)
  @IsNumber()
  @IsOptional()
  totalBill?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceJobMaterialDto)
  @IsOptional()
  materials?: ServiceJobMaterialDto[];

  @IsString()
  @IsOptional()
  supplierId?: string | null;

  @IsString()
  @IsOptional()
  supplierPaymentStatus?: string | null;
}
