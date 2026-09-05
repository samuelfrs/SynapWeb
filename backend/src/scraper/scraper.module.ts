import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { FirecrawlService } from './firecrawl.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ScraperController],
  providers: [ScraperService, FirecrawlService],
  exports: [ScraperService],
})
export class ScraperModule {}
