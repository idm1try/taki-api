import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleDto {
    @IsString()
    @ApiProperty({ type: String, required: true })
    accessToken: string;
}
