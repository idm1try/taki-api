import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';

  app.enableCors();
  app.use(helmet());
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription('Documents for TodoAPI')
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
