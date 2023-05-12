import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AvatarModule } from "../avatar/avatar.module";
import { MailModule } from "../mail/mail.module";
import { UserController } from "./user.controller";
import { User, UserSchema } from "./user.schema";
import { UserService } from "./user.service";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MailModule,
        AvatarModule,
    ],
    providers: [UserService],
    exports: [UserService],
    controllers: [UserController],
})
export class UserModule {}
