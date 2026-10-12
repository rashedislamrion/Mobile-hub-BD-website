import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  courierPartner: string;

  @IsString()
  @IsNotEmpty()
  trackingNo: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
