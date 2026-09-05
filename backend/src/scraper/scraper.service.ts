import { Injectable, Logger } from '@nestjs/common';
import { FirecrawlService } from './firecrawl.service';
import { GeminiService } from '../ai/gemini.service';
import { ScrapeUrlDto, CrawlDomainDto, ExtractJsonDto } from './dto/scrape.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly firecrawl: FirecrawlService,
    private readonly gemini: GeminiService,
  ) {}

  async scrapeUrl(dto: ScrapeUrlDto, customFirecrawlKey?: string) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    const result = await this.firecrawl.scrape(dto.url, customFirecrawlKey);

    return {
      id: jobId,
      url: dto.url,
      mode: 'SCRAPE' as const,
      format: (dto.format || 'MARKDOWN') as 'MARKDOWN' | 'JSON',
      status: 'COMPLETED' as const,
      contentMd: result.markdown,
      contentJson: null,
      metadata: result.metadata || {},
      error: null,
      createdAt: now,
      updatedAt: new Date().toISOString(),
    };
  }

  async crawlDomain(dto: CrawlDomainDto, customFirecrawlKey?: string) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    const result = await this.firecrawl.crawl(dto.url, dto.limit, customFirecrawlKey);

    const combinedMarkdown =
      result.data
        ?.map(
          (page) =>
            `# ${page.metadata?.title || page.metadata?.sourceURL || 'Sem título'}\n\n${page.markdown}`,
        )
        .join('\n\n---\n\n') || '';

    return {
      id: jobId,
      url: dto.url,
      mode: 'CRAWL' as const,
      format: 'MARKDOWN' as const,
      status: 'COMPLETED' as const,
      contentMd: combinedMarkdown,
      contentJson: null,
      metadata: {
        pagesCount: result.data?.length || 0,
        crawlJobId: result.jobId,
      },
      error: null,
      createdAt: now,
      updatedAt: new Date().toISOString(),
    };
  }

  async extractJson(
    dto: ExtractJsonDto,
    customFirecrawlKey?: string,
    customGeminiKey?: string,
  ) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    const result = await this.firecrawl.extract(
      dto.url,
      dto.prompt,
      dto.schema,
      customFirecrawlKey,
    );

    let extractedJson = result.json;

    if (
      (!extractedJson ||
        (typeof extractedJson === 'object' &&
          Object.keys(extractedJson).length === 0)) &&
      result.markdown
    ) {
      this.logger.log(
        `Firecrawl json was empty, using Gemini fallback for ${dto.url}`,
      );
      try {
        const geminiJson = await this.gemini.extractJsonFromContent(
          result.markdown,
          dto.prompt,
          dto.schema,
          customGeminiKey,
        );
        if (geminiJson) {
          extractedJson = geminiJson;
        }
      } catch (geminiErr: any) {
        this.logger.warn(`Gemini JSON fallback failed: ${geminiErr.message}`);
      }
    }

    return {
      id: jobId,
      url: dto.url,
      mode: 'EXTRACT' as const,
      format: 'JSON' as const,
      status: 'COMPLETED' as const,
      contentMd: result.markdown || null,
      contentJson: extractedJson || {},
      metadata: result.metadata || {},
      error: null,
      createdAt: now,
      updatedAt: new Date().toISOString(),
    };
  }

  async getJobs() {
    return [];
  }

  async getJob(id: string) {
    return null;
  }
}
