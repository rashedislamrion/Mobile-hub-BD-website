import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  issueTypeId: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateTicketMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}
