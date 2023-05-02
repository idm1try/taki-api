import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleAuthDto {
    @IsString()
    @ApiProperty({ type: String, required: true })
    accessToken: string;
}
