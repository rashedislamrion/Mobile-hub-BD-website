import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ServiceJobStatus } from '@prisma/client';

export class UpdateServiceJobStatusDto {
  @IsEnum(ServiceJobStatus)
  @IsNotEmpty()
  status: ServiceJobStatus;

  @IsString()
  @IsOptional()
  note?: string;
}
