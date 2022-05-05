import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { appConfig, authConfig, mailConfig, mongoConfig } from './config';
import { MongooseConfigService } from './database/mongoose.database';
import { KeyModule } from './key/key.module';
import { MailConfigService } from './mail/mail-config.service';
import { UserModule } from './user/user.module';

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
    UserModule,
    AuthModule,
    KeyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
