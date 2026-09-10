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

  async scrapeUrl(
    dto: ScrapeUrlDto,
    customFirecrawlKey?: string,
    customGeminiKey?: string,
  ) {
    const jobId = randomUUID();
    const now = new Date().toISOString();

    const result = await this.firecrawl.scrape(dto.url, customFirecrawlKey);
    let finalMarkdown = result.markdown || '';
    let finalMetadata: Record<string, any> = { ...(result.metadata || {}) };

    // 1. Verificar se é uma publicação científica e se está restrita por paywall
    const isAcademicDomain = /ieeexplore\.ieee\.org|dl\.acm\.org|nature\.com|sciencedirect\.com|link\.springer\.com|onlinelibrary\.wiley\.com|tandfonline\.com|pubs\.acs\.org|cell\.com|science\.org|iopscience\.iop\.org/i.test(
      dto.url,
    );
    const isPaywalled = /sign in to continue reading|sign in or purchase|purchase details|purchase pdf|access through your institution|subscription required|buy this article|restricted access/i.test(
      finalMarkdown,
    );

    // 2. Extrair DOI da URL, metadados ou conteúdo textual raspado
    const combinedText = `${dto.url} ${result.metadata?.doi || ''} ${finalMarkdown}`;
    const doiMatch = combinedText.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
    const doi = doiMatch ? doiMatch[0].replace(/[.,;)]+$/, '') : null;

    if ((isAcademicDomain || isPaywalled) && doi) {
      this.logger.log(`Detectado artigo científico com paywall (DOI: ${doi}). Consultando Unpaywall para versão aberta...`);
      try {
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
            this.logger.log(`Versão aberta encontrada no Unpaywall: ${openUrl}. Raspando artigo completo...`);
            try {
              const oaScrape = await this.firecrawl.scrape(openUrl, customFirecrawlKey);
              if (oaScrape.markdown && oaScrape.markdown.length > 500) {
                finalMarkdown = `# 🔓 Artigo Completo Resgatado via Open Access\n\n> **Fonte Original (Paywall):** [${dto.url}](${dto.url})\n> **Versão Aberta Autorizada:** [${openUrl}](${openUrl})\n> **DOI:** ${doi}\n> **Título:** ${unpaywallData.title || result.metadata?.title || 'N/A'}\n\n---\n\n${oaScrape.markdown}`;
                finalMetadata = {
                  ...finalMetadata,
                  isLegalOpenAccess: true,
                  unpaywallUrl: openUrl,
                  doi,
                  title: unpaywallData.title || result.metadata?.title,
                  hostType: unpaywallData.best_oa_location?.host_type,
                };
              }
            } catch (oaScrapeErr: any) {
              this.logger.warn(`Falha ao raspar versão aberta do Unpaywall: ${oaScrapeErr.message}`);
            }
          }
        }
      } catch (unpaywallErr: any) {
        this.logger.warn(`Erro na consulta ao Unpaywall: ${unpaywallErr.message}`);
      }

      // Se não havia versão aberta no Unpaywall mas o artigo estava bloqueado por paywall, gerar Dossiê Científico por IA
      if (!finalMetadata.isLegalOpenAccess && isPaywalled && finalMarkdown.length < 3000) {
        this.logger.log(`Artigo fechado sem preprint aberto. Gerando síntese de literatura científica por IA para DOI ${doi}...`);
        try {
          const synthesis = await this.gemini.synthesizeLiterature(
            doi,
            result.metadata?.title,
            dto.url,
            customGeminiKey,
          );
          if (synthesis && synthesis.length > 200) {
            finalMarkdown = synthesis;
            finalMetadata = {
              ...finalMetadata,
              isReconstructed: true,
              doi,
              originalUrl: dto.url,
              methodology: 'Consenso de Literatura Científica & Citações',
            };
          }
        } catch (synthErr: any) {
          this.logger.warn(`Falha na reconstrução de literatura: ${synthErr.message}`);
        }
      }
    }

    return {
      id: jobId,
      url: dto.url,
      mode: 'SCRAPE' as const,
      format: (dto.format || 'MARKDOWN') as 'MARKDOWN' | 'JSON',
      status: 'COMPLETED' as const,
      contentMd: finalMarkdown,
      contentJson: null,
      metadata: finalMetadata,
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
      let mime = dto.mimeType || 'application/pdf';
      if (!mime || mime === 'application/octet-stream') {
        const ext = dto.filename.split('.').pop()?.toLowerCase();
        if (ext === 'png') mime = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'gif') mime = 'image/gif';
        else mime = 'application/pdf';
      }
      contentMd = await this.gemini.processMultimodalFile(
        dto.base64,
        mime,
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

    // Extract DOI from URL if not explicitly provided, or scrape landing page to resolve DOI
    let doiMatch = dto.url.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
    let doi = dto.doi || (doiMatch ? doiMatch[0].replace(/[.,;)]+$/, '') : null);

    if (!doi && dto.url.startsWith('http')) {
      try {
        const landing = await this.firecrawl.scrape(dto.url, customFirecrawlKey);
        const combined = `${dto.url} ${landing.metadata?.doi || ''} ${landing.markdown}`;
        const match = combined.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
        if (match) {
          doi = match[0].replace(/[.,;)]+$/, '');
        }
      } catch (err: any) {
        this.logger.warn(`Could not extract DOI from landing page: ${err.message}`);
      }
    }

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
