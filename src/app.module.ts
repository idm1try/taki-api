import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { MongooseConfigService } from './database/mongoose.database';
import { UserModule } from './user/user.module';
import { KeyModule } from './key/key.module';
import { MailConfigService } from './mail/mail-config.service';
import { AuthModule } from './auth/auth.module';
import { appConfig, mongoConfig, authConfig, mailConfig } from './config';

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
