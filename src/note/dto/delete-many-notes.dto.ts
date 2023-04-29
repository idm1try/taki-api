import { IsString } from 'class-validator';

export class DeleteManyNotesDto {
    @IsString({ each: true })
    noteIds: string[];
}
