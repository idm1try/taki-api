import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { APIResponse } from '../helpers';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
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

  public async deleteOne(userId: string, taskId: string): APIResponse<void> {
    try {
      await this.taskModel.deleteOne({
        _id: taskId,
        user: userId,
      });
    } catch (error) {
      throw new NotAcceptableException('Task not found to delete');
    }
  }

  public async deleteMany(
    userId: string,
    taskIds: string[],
  ): APIResponse<void> {
    try {
      await this.taskModel.deleteMany({ _id: { $in: taskIds }, user: userId });
    } catch (error) {
      throw new NotAcceptableException('Tasks not found to delete');
    }
  }

  public async update(
    userId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ): APIResponse<Task> {
    if (!Object.keys(updateTaskDto).length) {
      throw new NotAcceptableException('Nothing new to update');
    }

    try {
      const updatedTask = await this.taskModel
        .findOneAndUpdate({ _id: taskId, user: userId }, updateTaskDto, {
          returnDocument: 'after',
        })
        .exec();
      return updatedTask;
    } catch (error) {
      throw new NotAcceptableException('Task not found to update');
    }
  }
}
