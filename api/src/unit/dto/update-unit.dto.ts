import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { StaffStatus } from '@prisma/client';

export class UpdateUnitDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shortCode?: string;

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
