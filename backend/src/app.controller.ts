import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'SynapWeb API',
      status: 'online',
      version: '1.0.0',
      description: 'Web-to-LLM Intelligence Engine API is up and running!',
      endpoints: {
        health: 'GET /api',
        scrape: 'POST /api/scrape',
        crawl: 'POST /api/scrape/crawl',
        extract: 'POST /api/scrape/extract',
        chat: 'POST /api/chat/:jobId',
      },
    };
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
