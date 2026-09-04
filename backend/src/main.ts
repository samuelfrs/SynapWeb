import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express, { Express } from 'express';

const server: Express = express();
let isReady = false;

const createServer = async () => {
  if (isReady) return server;
  
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });
  
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  app.setGlobalPrefix('api');
  await app.init();
  isReady = true;
  return server;
};

// Vercel Serverless Handler
export default async (req: any, res: any) => {
  await createServer();
  server(req, res);
};

// Local development
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.listen(3001);
    console.log('🚀 Backend running on http://localhost:3001');
  })();
}
