import { IsNotEmpty, IsString } from 'class-validator';

export class AddOrderNoteDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}
