import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateSalesReturnItemDto {
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  quantity: number;
}

export class CreateSalesReturnDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesReturnItemDto)
  items: CreateSalesReturnItemDto[];
}

export class RejectSalesReturnDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
