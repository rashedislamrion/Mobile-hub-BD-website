import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { StaffStatus } from '@prisma/client';

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1')
      return true;
    if (value === 'false' || value === false || value === 0 || value === '0')
      return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value ? StaffStatus.ACTIVE : StaffStatus.INACTIVE;
    }
    if (value === 'true') return StaffStatus.ACTIVE;
    if (value === 'false') return StaffStatus.INACTIVE;
    return value;
  })
  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}
