import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import appConfig from './configs/app.config';
import mongoConfig from './configs/mongo.config';
import { MongooseConfigService } from './databases/mongoose.database';
import { UsersModule } from './users/users.module';
import { KeysModule } from './keys/keys.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      load: [appConfig, mongoConfig],
    }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    UsersModule,
    KeysModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
