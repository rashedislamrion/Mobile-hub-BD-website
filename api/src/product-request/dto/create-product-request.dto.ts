import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductRequestItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  productVariantId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  requestedQty: number;
}

export class CreateProductRequestDto {
  @IsNotEmpty()
  @IsString()
  fulfillingBranchId: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductRequestItemDto)
  items: CreateProductRequestItemDto[];
}
