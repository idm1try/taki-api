import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { MongooseConfigService } from './databases/mongoose.database';
import { UsersModule } from './users/users.module';
import { KeysModule } from './keys/keys.module';
import appConfig from './configs/app.config';
import mongoConfig from './configs/mongo.config';
import mailConfig from './configs/mail.config';
import authConfig from './configs/auth.config';
import { MailConfigService } from './mail/mail-config.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      load: [appConfig, mongoConfig, authConfig, mailConfig],
    }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    MailerModule.forRootAsync({
      useClass: MailConfigService,
    }),
    UsersModule,
    AuthModule,
    KeysModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
