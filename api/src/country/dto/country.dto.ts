import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StaffStatus } from '@prisma/client';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpdateCountryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}
