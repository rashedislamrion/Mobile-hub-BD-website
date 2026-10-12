import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDeliveryChargeTierDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  minOrderQty: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  maxOrderQty: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  charge: number;
}

export class UpdateDeliveryChargeTierDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  minOrderQty?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxOrderQty?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  charge?: number;
}
