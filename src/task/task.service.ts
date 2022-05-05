import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { APIResponse } from '../helpers';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './task.schema';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  public async create(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): APIResponse<Task> {
    const task = await this.taskModel.create({
      ...createTaskDto,
      user: userId,
    });

    return task;
  }

  public async getAll(
    userId: string,
    skip: number,
    limit: number,
  ): APIResponse<Task[]> {
    return this.taskModel.find({ user: userId }).skip(skip).limit(limit).lean();
  }
}
