import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExchangeDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  oldOrderItemId: string;

  @IsString()
  @IsNotEmpty()
  newProductId: string;

  @IsString()
  @IsOptional()
  newVariantId?: string;

  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  @IsNumber()
  @IsOptional()
  priceDifference?: number;
}

export class RejectExchangeDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
