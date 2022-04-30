import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(8, 25)
  @ApiProperty({ type: String, required: true, minLength: 8, maxLength: 25 })
  password: string;
}
