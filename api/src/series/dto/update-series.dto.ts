import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { StaffStatus } from '@prisma/client';

export class UpdateSeriesDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

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
