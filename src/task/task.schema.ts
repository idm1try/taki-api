import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { PriorityLevel } from './task.type';
import { Transform } from 'class-transformer';

@Schema({ timestamps: true })
export class Task extends Document {
    @Prop({ required: true })
    title: string;

    @Prop({ required: false })
    desc?: string;

    @Prop({ types: Types.ObjectId, ref: User.name, required: true })
    user: string;

    @Prop({ required: false, default: false })
    isDone?: boolean;

    @Prop({
        required: false,
        default: PriorityLevel.LOW,
    })
    priorityLevel?: PriorityLevel;

    @Transform((dueDate: any) => new Date(dueDate))
    @Prop({ required: false })
    dueDate?: Date | null;
}

const TaskSchema = SchemaFactory.createForClass(Task);

export { TaskSchema };
