import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Hashing } from '../common/helpers';

@Schema({ timestamps: true })
export class Key extends Document {
    @Prop({ required: false, unique: true })
    key?: string;

    @Prop({ unique: true, required: true })
    email: string;
}

const KeySchema = SchemaFactory.createForClass(Key);

// Remove when expired time 5 minutes
KeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 60 });

KeySchema.pre('save', async function (this: Key, next) {
    this.key = await Hashing.createHash();
    next();
});

export { KeySchema };
