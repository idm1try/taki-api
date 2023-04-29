import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { AccountType } from '../auth.type';

export class DisconnectAccountDto {
    @IsString()
    @IsEnum(AccountType)
    @ApiProperty({ type: String, required: true })
    type: AccountType;
}
