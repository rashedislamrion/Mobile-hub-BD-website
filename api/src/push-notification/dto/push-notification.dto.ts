import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationStatus, NotificationTarget } from '@prisma/client';

export class CreatePushNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotificationTarget)
  @IsOptional()
  targetAudience?: NotificationTarget = NotificationTarget.ALL_CUSTOMERS;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsIn(['now', 'scheduled', 'draft'])
  @IsOptional()
  sendOption?: 'now' | 'scheduled' | 'draft' = 'now';

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;
}
