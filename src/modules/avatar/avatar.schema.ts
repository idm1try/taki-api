import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Avatar extends Document {
    @Prop({ required: false, unique: true })
    deletehash: string;

    @Prop({ unique: true, required: true })
    url: string;

    @Prop({ unique: true, required: true })
    userId: string;
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
