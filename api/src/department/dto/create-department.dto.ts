import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StaffStatus } from '@prisma/client';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  headId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  headId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}
