import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { FirecrawlService } from './firecrawl.service';
import { GeminiService } from '../ai/gemini.service';
import {
  ScrapeUrlDto,
  CrawlDomainDto,
  ExtractJsonDto,
  UploadFileDto,
  ReconstructPaperDto,
} from './dto/scrape.dto';
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

  async processUpload(dto: UploadFileDto, customGeminiKey?: string) {
    const jobId = randomUUID();
    const now = new Date().toISOString();
    let contentMd = '';

    if (dto.textContent) {
      contentMd = dto.textContent;
    } else if (dto.base64) {
      contentMd = await this.gemini.processMultimodalFile(
        dto.base64,
        dto.mimeType,
        dto.prompt,
        customGeminiKey,
      );
    } else {
      throw new InternalServerErrorException('Arquivo vazio ou não fornecido.');
    }

    return {
      id: jobId,
      url: dto.filename,
      mode: 'UPLOAD' as const,
      format: 'MARKDOWN' as const,
      status: 'COMPLETED' as const,
      contentMd,
      contentJson: null,
      metadata: {
        filename: dto.filename,
        mimeType: dto.mimeType,
        size: dto.base64 ? Math.round(dto.base64.length * 0.75) : dto.textContent?.length || 0,
        uploadedAt: now,
      },
      error: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async reconstructAcademic(
    dto: ReconstructPaperDto,
    customFirecrawlKey?: string,
    customGeminiKey?: string,
  ) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    // Extract DOI from URL if not explicitly provided
    const doiMatch = dto.url.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
    const doi = dto.doi || (doiMatch ? doiMatch[0] : null);

    let openAccessMarkdown: string | null = null;
    let openAccessMeta: Record<string, any> = {};

    // 1. Try Unpaywall API if DOI exists
    if (doi) {
      try {
        this.logger.log(`Consulting Unpaywall for DOI: ${doi}`);
        const unpaywallRes = await fetch(
          `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=synapweb@gmail.com`,
          { headers: { 'User-Agent': 'SynapWeb/1.0' } },
        );

        if (unpaywallRes.ok) {
          const unpaywallData = await unpaywallRes.json();
          const openUrl =
            unpaywallData.best_oa_location?.url_for_pdf ||
            unpaywallData.best_oa_location?.url;

          if (openUrl) {
            this.logger.log(`Found open access preprint via Unpaywall: ${openUrl}`);
            try {
              const scrapedOa = await this.firecrawl.scrape(openUrl, customFirecrawlKey);
              if (scrapedOa.markdown && scrapedOa.markdown.length > 200) {
                openAccessMarkdown = `# 🔓 Artigo Aberto Resgatado (via Unpaywall)\n\n> **Fonte Aberta Autorizada:** [${openUrl}](${openUrl})\n> **DOI:** ${doi}\n> **Título:** ${unpaywallData.title || 'N/A'}\n\n---\n\n${scrapedOa.markdown}`;
                openAccessMeta = {
                  unpaywallUrl: openUrl,
                  doi,
                  title: unpaywallData.title,
                  hostType: unpaywallData.best_oa_location?.host_type,
                  license: unpaywallData.best_oa_location?.license,
                  isLegalOpenAccess: true,
                };
              }
            } catch (scrapeErr: any) {
              this.logger.warn(`Failed scraping open access URL: ${scrapeErr.message}`);
            }
          }
        }
      } catch (unpaywallErr: any) {
        this.logger.warn(`Unpaywall API query error: ${unpaywallErr.message}`);
      }
    }

    // 2. If Open Access version was obtained, return it!
    if (openAccessMarkdown) {
      return {
        id: jobId,
        url: dto.url,
        mode: 'SCRAPE' as const,
        format: 'MARKDOWN' as const,
        status: 'COMPLETED' as const,
        contentMd: openAccessMarkdown,
        contentJson: null,
        metadata: openAccessMeta,
        error: null,
        createdAt: now,
        updatedAt: now,
      };
    }

    // 3. Fallback: Deep Synthesis via Literature, Citations & Consensus
    this.logger.log(`Running deep literature synthesis for ${dto.url} (DOI: ${doi})`);
    const synthesis = await this.gemini.synthesizeLiterature(
      doi || 'Não detectado',
      undefined,
      dto.url,
      customGeminiKey,
    );

    return {
      id: jobId,
      url: dto.url,
      mode: 'EXTRACT' as const,
      format: 'MARKDOWN' as const,
      status: 'COMPLETED' as const,
      contentMd: synthesis,
      contentJson: null,
      metadata: {
        isReconstructed: true,
        doi,
        originalUrl: dto.url,
        methodology: 'Consenso de Literatura Científica & Citações',
        reconstructedAt: now,
      },
      error: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getJobs() {
    return [];
  }

  async getJob(id: string) {
    return null;
  }
}
