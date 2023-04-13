import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PriorityLevel } from '../task.type';

export class UpdateTaskDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Length(2, 255)
  @ApiProperty({ type: String, required: true, minLength: 2, maxLength: 255 })
  title?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Length(2, 255)
  @ApiProperty({ type: String, required: false, minLength: 2, maxLength: 255 })
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
  @IsISO8601()
  @ApiProperty({ type: Date, required: false })
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}
