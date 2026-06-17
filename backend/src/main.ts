import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ENV } from './config/env';
import { corsOptions } from './config/cors';

// Legacy Express router — mounts the modules not yet migrated to NestJS.
import legacyRouter from './routes/index';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });

  // ── Security + parsing ──
  app.use(helmet());
  app.enableCors(corsOptions as any);
  app.use(cookieParser());

  // ── Global validation (class-validator DTOs) ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip unknown properties
      forbidNonWhitelisted: false,
      transform: true,            // auto-transform payloads to DTO types
      stopAtFirstError: false,    // collect all validation errors
    }),
  );

  // ── API prefix ──
  app.setGlobalPrefix('api/v1');

  // ── Swagger / OpenAPI at /api-docs ──
  const config = new DocumentBuilder()
    .setTitle('Amdox ERP API')
    .setDescription('AI-Powered Cloud ERP Suite — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // ── Mount legacy Express routes for un-migrated modules ──
  // NestJS owns /api/v1/auth; legacy router serves the rest.
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.use('/api/v1', legacyRouter);

  await app.listen(ENV.PORT);
  logger.log(`NestJS server running on http://localhost:${ENV.PORT}`);
  logger.log(`Swagger docs at http://localhost:${ENV.PORT}/api-docs`);
}

bootstrap();
