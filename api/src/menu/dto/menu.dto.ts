import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MenuLinkType, MenuType, StaffStatus } from '@prisma/client';

export class CreateMenuItemDto {
  @IsEnum(MenuType)
  menuType: MenuType;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsEnum(MenuLinkType)
  @IsOptional()
  linkType?: MenuLinkType = MenuLinkType.CUSTOM;

  @IsString()
  @IsNotEmpty()
  linkValue: string;

  @IsBoolean()
  @IsOptional()
  openInNewTab?: boolean = false;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number = 0;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus = StaffStatus.ACTIVE;
}

export class UpdateMenuItemDto {
  @IsEnum(MenuType)
  @IsOptional()
  menuType?: MenuType;

  @IsString()
  @IsOptional()
  label?: string;

  @IsEnum(MenuLinkType)
  @IsOptional()
  linkType?: MenuLinkType;

  @IsString()
  @IsOptional()
  linkValue?: string;

  @IsBoolean()
  @IsOptional()
  openInNewTab?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}

export class ReorderMenuItemsDto {
  @IsArray()
  @IsString({ each: true })
  menuItemIds: string[];
}

export class AddMenuBuilderItemsDto {
  @IsString()
  @IsNotEmpty()
  sourceType: 'PAGE' | 'CATEGORY' | 'CUSTOM';

  @IsArray()
  @IsOptional()
  sourceIds?: string[];

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  label?: string;
}

export class UpdateMenuBuilderItemDto {
  @IsString()
  @IsOptional()
  urlSlug?: string;

  @IsString()
  @IsOptional()
  navigationLabel?: string;

  @IsString()
  @IsOptional()
  titleAttribute?: string;
}

export class ReorderMenuBuilderDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
