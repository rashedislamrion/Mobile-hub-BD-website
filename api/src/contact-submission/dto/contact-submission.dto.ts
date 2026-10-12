import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ContactSubmissionStatus } from '@prisma/client';

export class CreateContactSubmissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateContactSubmissionStatusDto {
  @IsEnum(ContactSubmissionStatus)
  @IsNotEmpty()
  status: ContactSubmissionStatus;
}
