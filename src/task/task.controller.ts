import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestWithParsedPayload } from '../auth/auth.type';
import { JwtAccessGuard } from '../common/guards';
import { CreateTaskDto } from './dto/create-task.dto';
import { DeleteManyTasksDto } from './dto/delete-many-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAccessGuard)
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    create(
        @Req() req: RequestWithParsedPayload,
        @Body() createTaskDto: CreateTaskDto,
    ) {
        return this.taskService.create(req.user.userId, createTaskDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    getAll(
        @Req() req: RequestWithParsedPayload,
        @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.taskService.getAll(req.user.userId, skip, limit);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    deleteOne(@Req() req: RequestWithParsedPayload, @Param('id') id: string) {
        return this.taskService.deleteOne(req.user.userId, id);
    }

    @Delete()
    @HttpCode(HttpStatus.OK)
    deleteMany(
        @Req() req: RequestWithParsedPayload,
        @Body() deleteManyTasksDto: DeleteManyTasksDto,
    ) {
        return this.taskService.deleteMany(
            req.user.userId,
            deleteManyTasksDto.taskIds,
        );
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    update(
        @Req() req: RequestWithParsedPayload,
        @Body() updateTaskDto: UpdateTaskDto,
        @Param('id') id: string,
    ) {
        return this.taskService.update(req.user.userId, id, updateTaskDto);
    }
}
