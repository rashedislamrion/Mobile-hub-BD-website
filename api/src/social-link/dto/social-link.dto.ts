import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SocialPlatform, StaffStatus } from '@prisma/client';

export class UpdateSocialLinkDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpsertSocialLinkDto {
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}
