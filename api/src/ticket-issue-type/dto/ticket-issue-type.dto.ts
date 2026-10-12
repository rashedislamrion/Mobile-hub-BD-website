import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IssueCategory, StaffStatus } from '@prisma/client';

export class CreateTicketIssueTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IssueCategory)
  category: IssueCategory;

  @IsString()
  @IsOptional()
  autoAssignRoleId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpdateTicketIssueTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(IssueCategory)
  @IsOptional()
  category?: IssueCategory;

  @IsString()
  @IsOptional()
  autoAssignRoleId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}
