import { IsString } from "class-validator";

export class DeleteManyTasksDto {
    @IsString({ each: true })
    taskIds: string[];
}
