import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 20)
  @ApiProperty({ type: String, required: true, minLength: 2, maxLength: 20 })
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 25)
  @ApiProperty({ type: String, required: true, minLength: 8, maxLength: 25 })
  password: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ type: String, required: true })
  email: string;
}
