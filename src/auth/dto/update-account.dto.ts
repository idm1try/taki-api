import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateAccountDto {
    @IsOptional()
    @IsString()
    @Length(2, 20)
    @ApiProperty({ type: String, required: false, minLength: 2, maxLength: 20 })
    name?: string;

    @IsOptional()
    @IsEmail()
    @ApiProperty({ type: String, required: false })
    email?: string;
}
