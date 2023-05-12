import { Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { ConfigModule } from "@nestjs/config";
import { mailConfig } from "../../common/configs";

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [mailConfig],
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
