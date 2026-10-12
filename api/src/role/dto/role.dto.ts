import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModuleName, PermissionAction, PermissionScope } from '@prisma/client';

export class PermissionItemDto {
  @IsEnum(ModuleName)
  @IsNotEmpty()
  module: ModuleName;

  @IsEnum(PermissionAction)
  @IsNotEmpty()
  action: PermissionAction;

  @IsBoolean()
  @IsNotEmpty()
  allowed: boolean;
}

export class UpdateRolePermissionsDto {
  @IsEnum(PermissionScope)
  @IsOptional()
  scope?: PermissionScope;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions: PermissionItemDto[];
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PermissionScope)
  @IsOptional()
  scope?: PermissionScope = PermissionScope.GLOBAL;

  @IsString()
  @IsOptional()
  cloneFromRoleId?: string;
}

export class RoleBranchPermissionItemDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsBoolean()
  @IsNotEmpty()
  canAccess: boolean;
}

export class UpdateRoleBranchPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleBranchPermissionItemDto)
  branchPermissions: RoleBranchPermissionItemDto[];
}
