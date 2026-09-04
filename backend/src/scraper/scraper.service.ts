import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirecrawlService } from './firecrawl.service';
import { ScrapeUrlDto, CrawlDomainDto, ExtractJsonDto } from './dto/scrape.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firecrawl: FirecrawlService,
  ) {}

  async scrapeUrl(dto: ScrapeUrlDto) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    // Try saving initial job in DB if available
    try {
      await this.prisma.scrapeJob.create({
        data: {
          id: jobId,
          url: dto.url,
          mode: 'SCRAPE',
          format: dto.format || 'MARKDOWN',
          status: 'PROCESSING',
        },
      });
    } catch {
      // Non-blocking for offline/stateless mode
    }

    try {
      const result = await this.firecrawl.scrape(dto.url);

      const jobData = {
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

      try {
        await this.prisma.scrapeJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            contentMd: result.markdown,
            metadata: result.metadata as any,
          },
        });
      } catch {
        // Non-blocking
      }

      return jobData;
    } catch (error: any) {
      try {
        await this.prisma.scrapeJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          },
        });
      } catch {}

      throw error;
    }
  }

  async crawlDomain(dto: CrawlDomainDto) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    try {
      await this.prisma.scrapeJob.create({
        data: {
          id: jobId,
          url: dto.url,
          mode: 'CRAWL',
          format: 'MARKDOWN',
          status: 'PROCESSING',
        },
      });
    } catch {}

    try {
      const result = await this.firecrawl.crawl(dto.url, dto.limit);

      const combinedMarkdown =
        result.data
          ?.map(
            (page) =>
              `# ${page.metadata?.title || page.metadata?.sourceURL || 'Sem título'}\n\n${page.markdown}`,
          )
          .join('\n\n---\n\n') || '';

      const jobData = {
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

      try {
        await this.prisma.scrapeJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            contentMd: combinedMarkdown,
            metadata: jobData.metadata as any,
          },
        });
      } catch {}

      return jobData;
    } catch (error: any) {
      try {
        await this.prisma.scrapeJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          },
        });
      } catch {}

      throw error;
    }
  }

  async extractJson(dto: ExtractJsonDto) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    try {
      await this.prisma.scrapeJob.create({
        data: {
          id: jobId,
          url: dto.url,
          mode: 'EXTRACT',
          format: 'JSON',
          status: 'PROCESSING',
        },
      });
    } catch {}

    try {
      const result = await this.firecrawl.extract(dto.url, dto.prompt, dto.schema);

      const jobData = {
        id: jobId,
        url: dto.url,
        mode: 'EXTRACT' as const,
        format: 'JSON' as const,
        status: 'COMPLETED' as const,
        contentMd: null,
        contentJson: result,
        metadata: {},
        error: null,
        createdAt: now,
        updatedAt: new Date().toISOString(),
      };

      try {
        await this.prisma.scrapeJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            contentJson: result,
          },
        });
      } catch {}

      return jobData;
    } catch (error: any) {
      try {
        await this.prisma.scrapeJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          },
        });
      } catch {}

      throw error;
    }
  }

  async getJobs() {
    try {
      return await this.prisma.scrapeJob.findMany({
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
    } catch {
      return [];
    }
  }

  async getJob(id: string) {
    try {
      return await this.prisma.scrapeJob.findUnique({
        where: { id },
      });
    } catch {
      return null;
    }
  }
}
