import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseStatus } from '@prisma/client';

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  monthlyBudget?: number;
}

export class UpdateExpenseCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  monthlyBudget?: number;
}

export class CreateExpenseDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  walletTypeId?: string;

  @IsEnum(ExpenseStatus)
  @IsOptional()
  status?: ExpenseStatus;

  @IsString()
  @IsOptional()
  date?: string;
}

export class MarkExpensePaidDto {
  @IsString()
  @IsOptional()
  walletTypeId?: string;
}
