import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const GLOBAL_PREFIX = 'api';

  app.enableCors({
    credentials: true,
    origin: true,
  });
  app.use(cookieParser());
  app.use(helmet());
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      skipMissingProperties: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Taki API')
    .setDescription('Documents for Taki API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${GLOBAL_PREFIX}/docs`, app, document);

  await app.listen(configService.get<number>('app.port'));

  const domain = configService.get<string>('app.domain');

  Logger.log(
    `API documentations is running on ${domain}/${GLOBAL_PREFIX}/docs`,
  );
  Logger.log(`Application is running on ${domain}/${GLOBAL_PREFIX}`);
}

bootstrap();
