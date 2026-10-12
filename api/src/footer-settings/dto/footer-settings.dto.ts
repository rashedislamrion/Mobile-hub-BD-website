import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateFooterSettingsDto {
  @IsString()
  @IsNotEmpty()
  supportPhone: string;

  @IsEmail()
  @IsNotEmpty()
  supportEmail: string;

  @IsString()
  @IsOptional()
  liveChatLink?: string;

  @IsString()
  @IsOptional()
  faqLink?: string;

  @IsString()
  @IsNotEmpty()
  copyrightText: string;
}

export class CreateFooterColumnItemDto {
  @IsString()
  @IsNotEmpty()
  sourceType: string; // 'MENU' | 'PAGE' | 'BRANCH' | 'CUSTOM'

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsNotEmpty()
  navigationLabel: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsOptional()
  extraData?: Record<string, any>;
}

export class UpdateFooterColumnItemDto {
  @IsString()
  @IsOptional()
  navigationLabel?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsOptional()
  extraData?: Record<string, any>;
}

export class ReorderFooterColumnItemsDto {
  @IsString()
  @IsNotEmpty()
  columnKey: string;

  @IsArray()
  @IsString({ each: true })
  orderedItemIds: string[];
}
