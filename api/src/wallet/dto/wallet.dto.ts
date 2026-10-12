import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PurposeCategory,
  StaffStatus,
  WalletKind,
  WalletTxnType,
} from '@prisma/client';

export class CreateWalletTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(WalletKind)
  @IsNotEmpty()
  kind: WalletKind;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  initialBalance?: number = 0;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpdateWalletTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(WalletKind)
  @IsOptional()
  kind?: WalletKind;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}

export class CreatePurposeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PurposeCategory)
  @IsNotEmpty()
  category: PurposeCategory;
}

export class UpdatePurposeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(PurposeCategory)
  @IsOptional()
  category?: PurposeCategory;
}

export class CreateWalletTransactionDto {
  @IsString()
  @IsNotEmpty()
  walletTypeId: string;

  @IsEnum(WalletTxnType)
  @IsNotEmpty()
  type: WalletTxnType;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  purposeId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  sourceWalletId: string;

  @IsString()
  @IsNotEmpty()
  targetWalletId: string;

  @IsString()
  @IsOptional()
  targetBranchId?: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateStaffPaymentDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  walletTypeId: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @IsString()
  @IsOptional()
  payType?: string; // SALARY, ALLOWANCE, BONUS, OTHER

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  salaryMonth?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  salaryAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  bonusAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  allowanceAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  deductionAmount?: number;

  @IsString()
  @IsOptional()
  allowanceFrequency?: string;
}
