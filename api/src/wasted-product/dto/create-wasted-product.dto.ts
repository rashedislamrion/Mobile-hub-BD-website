import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWastedProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string; // DAMAGED, EXPIRED, LOST, DEFECTIVE

  @IsString()
  @IsOptional()
  note?: string;

  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value)
      : undefined,
  )
  @IsNumber()
  @IsOptional()
  costImpact?: number;
}
