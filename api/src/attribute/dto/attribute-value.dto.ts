import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAttributeValueDto {
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpdateAttributeValueDto {
  @IsString()
  @IsOptional()
  value?: string;

  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1')
      return true;
    if (value === 'false' || value === false || value === 0 || value === '0')
      return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
