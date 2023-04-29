import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({ type: String, required: true })
    email: string;
}
