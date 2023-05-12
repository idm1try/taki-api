import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { Task } from "./task.schema";

@Injectable()
export class TaskService {
    constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

    public async create(
        userId: string,
        createTaskDto: CreateTaskDto,
    ): Promise<Task> {
        return this.taskModel.create({
            ...createTaskDto,
            user: userId,
        });
    }

    public async getAll(
        userId: string,
        skip: number,
        limit: number,
    ): Promise<Task[]> {
        return this.taskModel
            .find({ user: userId })
            .skip(skip)
            .limit(limit)
            .lean();
    }

    public async deleteOne(userId: string, taskId: string): Promise<Task> {
        return this.taskModel.findOneAndRemove({
            _id: taskId,
            user: userId,
        });
    }

    public async deleteMany(userId: string, taskIds: string[]): Promise<void> {
        await this.taskModel.deleteMany({
            _id: { $in: taskIds },
            user: userId,
        });
    }

    public async update(
        userId: string,
        taskId: string,
        updateTaskDto: UpdateTaskDto,
    ): Promise<Task> {
        return this.taskModel
            .findOneAndUpdate({ _id: taskId, user: userId }, updateTaskDto, {
                returnDocument: "after",
            })
            .exec();
    }
}
