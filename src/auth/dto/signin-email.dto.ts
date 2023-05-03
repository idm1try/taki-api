import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class SigninEmailDto {
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({ type: String, required: true })
    email: string;

    @IsString()
    @Length(8, 25)
    @ApiProperty({ type: String, required: true, minLength: 8, maxLength: 25 })
    password: string;
}
