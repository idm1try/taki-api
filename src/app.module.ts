import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './configs/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      load: [appConfig],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
