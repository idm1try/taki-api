import { ApiProperty } from "@nestjs/swagger";
import {
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
} from "class-validator";
import { PriorityLevel } from "../task.type";

export class CreateTaskDto {
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
    desc?: string;

    @IsOptional()
    @IsEnum(PriorityLevel)
    @ApiProperty({
        enum: PriorityLevel,
        required: false,
        default: PriorityLevel.LOW,
    })
    priorityLevel?: PriorityLevel;

    @IsOptional()
    @IsDate()
    @ApiProperty({ type: Date, required: false })
    dueDate?: Date;
}
