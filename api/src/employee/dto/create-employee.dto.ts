import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  EmploymentType,
  StaffPaymentMethod,
  StaffStatus,
} from '@prisma/client';

export class CreateEmployeeDto {
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
  @IsOptional()
  @MinLength(6)
  password?: string; // If omitted, defaults to temporary password

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  branchIds?: string[];

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType = EmploymentType.FULL_TIME;

  @IsString()
  @IsOptional()
  joiningDate?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  nidNumber?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @IsOptional()
  birthCertificateUrl?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  adminPanelAccess?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  sendCredentialsEmail?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  isTechnician?: boolean = false;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  commissionRate?: number = 0;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  emergencyContactRelationship?: string;

  @IsString()
  @IsOptional()
  reportingManagerId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  basicSalary?: number = 0;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bonusLimit?: number = 0;

  @IsOptional()
  allowances?: Record<string, number>;

  @IsEnum(StaffPaymentMethod)
  @IsOptional()
  paymentMethod?: StaffPaymentMethod;

  @IsString()
  @IsOptional()
  bankAccountNo?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  branchIds?: string[];

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsString()
  @IsOptional()
  joiningDate?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  nidNumber?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @IsOptional()
  birthCertificateUrl?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  adminPanelAccess?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  sendCredentialsEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  isTechnician?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  commissionRate?: number;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  emergencyContactRelationship?: string;

  @IsString()
  @IsOptional()
  reportingManagerId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  basicSalary?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bonusLimit?: number;

  @IsOptional()
  allowances?: Record<string, number>;

  @IsEnum(StaffPaymentMethod)
  @IsOptional()
  paymentMethod?: StaffPaymentMethod;

  @IsString()
  @IsOptional()
  bankAccountNo?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}

export class UpdateStatusDto {
  @IsEnum(StaffStatus)
  @IsNotEmpty()
  status: StaffStatus;
}

export class MakeTechnicianDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  commissionRate: number;
}
