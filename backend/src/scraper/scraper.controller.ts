import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScrapeUrlDto, CrawlDomainDto, ExtractJsonDto } from './dto/scrape.dto';

@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async scrapeUrl(@Body() dto: ScrapeUrlDto) {
    return this.scraperService.scrapeUrl(dto);
  }

  @Post('crawl')
  @HttpCode(HttpStatus.OK)
  async crawlDomain(@Body() dto: CrawlDomainDto) {
    return this.scraperService.crawlDomain(dto);
  }

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  async extractJson(@Body() dto: ExtractJsonDto) {
    return this.scraperService.extractJson(dto);
  }

  @Get('jobs')
  async getJobs() {
    return this.scraperService.getJobs();
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    const job = await this.scraperService.getJob(id);
    if (!job) throw new NotFoundException('Job não encontrado');
    return job;
  }
}
