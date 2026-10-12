import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveProductRequestItemDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  approvedQty: number;
}

export class ApproveProductRequestDto {
  @IsOptional()
  @IsString()
  decisionNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveProductRequestItemDto)
  items?: ApproveProductRequestItemDto[];
}

export class RejectProductRequestDto {
  @IsOptional()
  @IsString()
  decisionNote?: string;
}
