import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestWithParsedPayload } from 'src/auth/auth.type';
import { JwtAccessGuard } from '../auth/guard/jwt-access.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskService } from './task.service';

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
}
