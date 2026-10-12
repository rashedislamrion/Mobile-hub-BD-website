import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
    message: 'Password must contain at least 1 letter and 1 number',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Match('newPassword')
  confirmNewPassword: string;
}
