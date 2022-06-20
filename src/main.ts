import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationException } from './common/exceptions/validation.exeption';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';

  app.enableCors({
    credentials: true,
    origin: configService.get('app.clientOrigin'),
  });
  app.use(cookieParser());
  app.use(helmet());
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      skipMissingProperties: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationException(
          errors.reduce(
            (o, error) => ({
              ...o,
              [error.property]: Object.values(error.constraints),
            }),
            {},
          ),
        ),
    }),
  );
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ValidationExceptionFilter(),
    new HttpExceptionFilter(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Taki API')
    .setDescription('Documents for Taki API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  await app.listen(configService.get<number>('app.port'));

  const domain = configService.get<string>('app.domain');

  Logger.log(`API documentations is running on ${domain}/${globalPrefix}/docs`);
  Logger.log(`Application is running on ${domain}/${globalPrefix}`);
}

bootstrap();
