import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { PriorityLevel } from './task.type';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  desc?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User;

  @Prop({ required: false, default: false })
  isDone?: boolean;

  @Prop({
    required: false,
    default: PriorityLevel.LOW,
  })
  priorityLevel?: PriorityLevel;

  @Prop({ required: false })
  onDate?: Date | null;
}

const TaskSchema = SchemaFactory.createForClass(Task);

export { TaskSchema };
