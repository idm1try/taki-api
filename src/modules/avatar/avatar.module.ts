import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { imgurConfig } from "../../common/configs";
import { Avatar, AvatarSchema } from "./avatar.schema";
import { AvatarService } from "./avatar.service";

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [imgurConfig],
        }),
        MongooseModule.forFeature([
            { name: Avatar.name, schema: AvatarSchema },
        ]),
    ],
    providers: [AvatarService],
    exports: [AvatarService],
})
export class AvatarModule {}
