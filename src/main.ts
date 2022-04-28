import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';

  app.enableCors();
  app.use(helmet());
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(configService.get<number>('app.port'));

  const domain = configService.get<string>('app.domain');

  Logger.log(`Application is running on ${domain}/${globalPrefix}`);
}

bootstrap();
