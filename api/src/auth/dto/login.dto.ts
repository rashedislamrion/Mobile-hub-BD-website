import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsOptional()
  emailOrPhone?: string; // used for customer

  @IsString()
  @IsOptional()
  email?: string; // used for staff

  @IsString()
  @IsNotEmpty()
  password: string;
}
