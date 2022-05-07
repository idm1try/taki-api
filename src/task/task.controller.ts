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
    Post,
    Query,
    Req,
    UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestWithParsedPayload } from 'src/auth/auth.type';
import { JwtAccessGuard } from '../auth/guard/jwt-access.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskService } from './task.service';
import {DeleteManyTasksDto} from './dto/delete-many-tasks.dto'

@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  create(
    @Req() req: RequestWithParsedPayload,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(req.user.userId, createTaskDto);
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  getAll(
    @Req() req: RequestWithParsedPayload,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tasksService.getAll(req.user.userId, skip, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  deleteOne(@Req() req: RequestWithParsedPayload, @Param('id') id: string) {
    return this.tasksService.deleteOne(req.user.userId, id);
  }

  @Delete()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  deleteMany(@Req() req: RequestWithParsedPayload, @Body() deleteManyTasksDto: DeleteManyTasksDto) {
    return this.tasksService.deleteMany(req.user.userId, deleteManyTasksDto.taskIds );
  }

}
