import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateBusinessSettingsDto {
  @IsObject()
  @IsOptional()
  general?: Record<string, any>;

  @IsObject()
  @IsOptional()
  branding?: Record<string, any>;

  @IsObject()
  @IsOptional()
  currencyTax?: Record<string, any>;

  @IsObject()
  @IsOptional()
  orderSettings?: Record<string, any>;

  @IsObject()
  @IsOptional()
  notifications?: Record<string, any>;

  @IsObject()
  @IsOptional()
  verification?: Record<string, any>;

  @IsArray()
  @IsOptional()
  removeFields?: string[];
}

export class UpdateBusinessSetupDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyEmail?: string;

  @IsOptional()
  @IsString()
  companyPhone?: string;

  @IsOptional()
  @IsString()
  businessModel?: string;

  @IsOptional()
  @IsString()
  currencyPosition?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsObject()
  paymentMethodsSetup?: {
    codEnabled: boolean;
    onlinePaymentEnabled: boolean;
  };
}

export class UpdateVerificationDto {
  @IsOptional()
  @IsBoolean()
  customerRegistrationOtpVerify?: boolean;

  @IsOptional()
  @IsBoolean()
  mustVerifyOnOrderPlacement?: boolean;

  @IsOptional()
  @IsString()
  registerOtpMethod?: 'PHONE' | 'EMAIL';

  @IsOptional()
  @IsString()
  forgetPasswordOtpMethod?: 'PHONE' | 'EMAIL';

  @IsOptional()
  @IsBoolean()
  registrationPhoneRequired?: boolean;

  @IsOptional()
  @IsNumber()
  phoneMinLength?: number;

  @IsOptional()
  @IsNumber()
  phoneMaxLength?: number;
}
