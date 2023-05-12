import { MailerModule } from "@nestjs-modules/mailer";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./modules/auth/auth.module";
import { appConfig, mongoConfig } from "./common/configs";
import { LoggerMiddleware } from "./common/middlewares/logger.middleware";
import { MongooseConfigService } from "./common/providers/database/mongoose.database";
import { MailConfigService } from "./modules/mail/mail-config.service";
import { NoteModule } from "./modules/note/note.module";
import { TaskModule } from "./modules/task/task.module";
import { UserModule } from "./modules/user/user.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, mongoConfig],
        }),
        MongooseModule.forRootAsync({
            useClass: MongooseConfigService,
        }),
        MailerModule.forRootAsync({
            useClass: MailConfigService,
        }),
        UserModule,
        AuthModule,
        TaskModule,
        NoteModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(LoggerMiddleware).forRoutes("*");
    }
}
