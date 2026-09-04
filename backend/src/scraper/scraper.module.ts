import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { FirecrawlService } from './firecrawl.service';

@Module({
  controllers: [ScraperController],
  providers: [ScraperService, FirecrawlService],
  exports: [ScraperService],
})
export class ScraperModule {}
