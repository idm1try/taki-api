import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Hashing } from '../utils';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false, unique: true })
  email?: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ required: false, default: null })
  refreshToken?: string | null;

  @Prop({ required: false, default: false })
  isVerify?: boolean;

  @Prop({
    required: false,
    type: { id: String, email: String },
  })
  google?: {
    id: string | null;
    email: string | null;
  };

  @Prop({
    required: false,
    type: { id: String, email: String },
  })
  facebook?: {
    id: string | null;
    email: string | null;
  };
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (this: User, next) {
  if (this.password) {
    this.password = await Hashing.hash(this.password);
  }

  if (this.refreshToken) {
    this.refreshToken = await Hashing.hash(this.refreshToken);
  }

  next();
});

UserSchema.pre(/Update/, async function (this: any, next) {
  const modifiedField = this.getUpdate();

  if (modifiedField.password) {
    modifiedField.password = await Hashing.hash(modifiedField.password);
  }

  if (modifiedField.refreshToken) {
    modifiedField.refreshToken = await Hashing.hash(modifiedField.refreshToken);
  }

  if (modifiedField.email) {
    modifiedField.isVerify = false;
  }

  next();
});

export { UserSchema };
