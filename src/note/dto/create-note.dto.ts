import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class CreateNoteDto {
    @IsNotEmpty()
    @IsString()
    @Length(2, 255)
    @ApiProperty({ type: String, required: true, minLength: 2, maxLength: 255 })
    title: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @Length(2, 255)
    @ApiProperty({
        type: String,
        required: false,
        minLength: 2,
        maxLength: 255,
    })
    content: string;
}
