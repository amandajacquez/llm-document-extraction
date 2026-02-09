import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiErrorExceptionFilter } from './filters/api-error.filter';
import type { INestApplication } from '@nestjs/common';

/** Creates the Nest app (with global filter and validation). Use in server and tests. */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new ApiErrorExceptionFilter());
  return app;
}
