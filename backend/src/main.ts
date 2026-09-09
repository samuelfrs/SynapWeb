import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express, { Express } from 'express';

const server: Express = express();
server.use(express.json({ limit: '50mb' }));
server.use(express.urlencoded({ limit: '50mb', extended: true }));
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
    bodyParser: false,
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
  try {
    await createServer();
    server(req, res);
  } catch (err: any) {
    console.error('CRITICAL SERVERLESS BOOTSTRAP ERROR:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'FUNCTION_BOOTSTRAP_ERROR',
        message: err?.message || String(err),
        stack: err?.stack,
      });
    }
  }
}

// Compatibility with all Vercel function runners
(handler as any).default = handler;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  module.exports.default = handler;
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
