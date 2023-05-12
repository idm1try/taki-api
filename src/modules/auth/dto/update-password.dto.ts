import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class UpdatePasswordDto {
    @IsString()
    @Length(3, 40)
    @ApiProperty({ type: String, required: true, minLength: 3, maxLength: 40 })
    password: string;

    @IsString()
    @Length(8, 25)
    @ApiProperty({ type: String, required: true, minLength: 8, maxLength: 25 })
    newPassword: string;
}
