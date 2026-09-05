import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScraperModule } from './scraper/scraper.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [ScraperModule, AiModule],
  controllers: [AppController],
})
export class AppModule {}
