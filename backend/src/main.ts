import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express, { Express } from 'express';

const server: Express = express();
let isReady = false;

// Root landing route directly on express
server.get('/', (req, res) => {
  res.json({
    name: 'SynapWeb API',
    status: 'online',
    version: '1.0.0',
    description: 'Web-to-LLM Intelligence Engine API is up and running!',
    endpoints: {
      scrape: 'POST /api/scrape',
      crawl: 'POST /api/scrape/crawl',
      extract: 'POST /api/scrape/extract',
      chat: 'POST /api/chat/:jobId',
    },
  });
});

const createServer = async () => {
  if (isReady) return server;
  
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });
  
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-firecrawl-key', 'x-gemini-key'],
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
export default async function handler(req: any, res: any) {
  await createServer();
  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', reject);
    server(req, res);
  });
}

// Local development
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  (async () => {
    await createServer();
    server.listen(3001, () => {
      console.log('🚀 Backend running on http://localhost:3001');
    });
  })();
}
