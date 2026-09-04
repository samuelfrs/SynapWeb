import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirecrawlService } from './firecrawl.service';
import { ScrapeUrlDto, CrawlDomainDto, ExtractJsonDto } from './dto/scrape.dto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firecrawl: FirecrawlService,
  ) {}

  async scrapeUrl(dto: ScrapeUrlDto) {
    const job = await this.prisma.scrapeJob.create({
      data: {
        url: dto.url,
        mode: 'SCRAPE',
        format: dto.format || 'MARKDOWN',
        status: 'PROCESSING',
      },
    });

    try {
      const result = await this.firecrawl.scrape(dto.url);

      const updated = await this.prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          contentMd: result.markdown,
          metadata: result.metadata as any,
        },
      });

      return updated;
    } catch (error) {
      await this.prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });
      throw error;
    }
  }

  async crawlDomain(dto: CrawlDomainDto) {
    const job = await this.prisma.scrapeJob.create({
      data: {
        url: dto.url,
        mode: 'CRAWL',
        format: 'MARKDOWN',
        status: 'PROCESSING',
      },
    });

    try {
      const result = await this.firecrawl.crawl(dto.url, dto.limit);

      const combinedMarkdown = result.data
        ?.map((page) => `# ${page.metadata?.title || page.metadata?.sourceURL || 'Sem título'}\n\n${page.markdown}`)
        .join('\n\n---\n\n') || '';

      const updated = await this.prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          contentMd: combinedMarkdown,
          metadata: {
            pagesCount: result.data?.length || 0,
            crawlJobId: result.jobId,
          },
        },
      });

      return updated;
    } catch (error) {
      await this.prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });
      throw error;
    }
  }

  async extractJson(dto: ExtractJsonDto) {
    const job = await this.prisma.scrapeJob.create({
      data: {
        url: dto.url,
        mode: 'EXTRACT',
        format: 'JSON',
        status: 'PROCESSING',
      },
    });

    try {
      const result = await this.firecrawl.extract(dto.url, dto.prompt, dto.schema);

      const updated = await this.prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          contentJson: result,
        },
      });

      return updated;
    } catch (error) {
      await this.prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });
      throw error;
    }
  }

  async getJobs() {
    return this.prisma.scrapeJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        url: true,
        mode: true,
        status: true,
        format: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    });
  }

  async getJob(id: string) {
    return this.prisma.scrapeJob.findUnique({
      where: { id },
    });
  }
}
