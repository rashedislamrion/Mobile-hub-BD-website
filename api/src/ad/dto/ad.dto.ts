import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AdPlacement, PromoAdStatus } from '@prisma/client';

export class CreateAdDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  mobileThumbnailUrl?: string;

  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  isFeatured?: boolean = false;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AdPlacement)
  @IsOptional()
  placement?: AdPlacement;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(PromoAdStatus)
  @IsOptional()
  status?: PromoAdStatus = PromoAdStatus.ACTIVE;
}

export class UpdateAdDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  mobileThumbnailUrl?: string;

  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AdPlacement)
  @IsOptional()
  placement?: AdPlacement;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(PromoAdStatus)
  @IsOptional()
  status?: PromoAdStatus;
}

export class TrackAdDto {
  @IsString()
  @IsOptional()
  action?: 'impression' | 'click';

  @IsString()
  @IsOptional()
  type?: 'impression' | 'click';
}
