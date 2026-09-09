import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ScraperService } from './scraper.service';
import {
  ScrapeUrlDto,
  CrawlDomainDto,
  ExtractJsonDto,
  UploadFileDto,
  ReconstructPaperDto,
} from './dto/scrape.dto';

@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async scrapeUrl(
    @Body() dto: ScrapeUrlDto,
    @Headers('x-firecrawl-key') customFirecrawlKey?: string,
  ) {
    return this.scraperService.scrapeUrl(dto, customFirecrawlKey);
  }

  @Post('crawl')
  @HttpCode(HttpStatus.OK)
  async crawlDomain(
    @Body() dto: CrawlDomainDto,
    @Headers('x-firecrawl-key') customFirecrawlKey?: string,
  ) {
    return this.scraperService.crawlDomain(dto, customFirecrawlKey);
  }

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  async extractJson(
    @Body() dto: ExtractJsonDto,
    @Headers('x-firecrawl-key') customFirecrawlKey?: string,
    @Headers('x-gemini-key') customGeminiKey?: string,
  ) {
    return this.scraperService.extractJson(
      dto,
      customFirecrawlKey,
      customGeminiKey,
    );
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  async uploadFile(
    @Body() dto: UploadFileDto,
    @Headers('x-gemini-key') customGeminiKey?: string,
  ) {
    return this.scraperService.processUpload(dto, customGeminiKey);
  }

  @Post('reconstruct')
  @HttpCode(HttpStatus.OK)
  async reconstructPaper(
    @Body() dto: ReconstructPaperDto,
    @Headers('x-firecrawl-key') customFirecrawlKey?: string,
    @Headers('x-gemini-key') customGeminiKey?: string,
  ) {
    return this.scraperService.reconstructAcademic(
      dto,
      customFirecrawlKey,
      customGeminiKey,
    );
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
