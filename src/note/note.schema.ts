import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  content?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: string;
}

const NoteSchema = SchemaFactory.createForClass(Note);

export { NoteSchema };
