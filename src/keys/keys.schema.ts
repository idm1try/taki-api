import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/users.schema';
import { Hashing } from '../utils';

@Schema({ timestamps: true })
export class Key extends Document {
  @Prop({ required: true, unique: true })
  key?: string;

  @Prop({ type: Types.ObjectId, unique: true, required: true, ref: User.name })
  user: User;
}

const KeySchema = SchemaFactory.createForClass(Key);

// Remove when expired time 5 minutes
KeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 60 });

KeySchema.pre('save', async function (this: Key, next) {
  this.key = await Hashing.createHash();
  next();
});

export { KeySchema };
