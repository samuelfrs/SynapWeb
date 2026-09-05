import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

interface FirecrawlScrapeResult {
  markdown: string;
  metadata: Record<string, any>;
}

interface FirecrawlCrawlResult {
  jobId: string;
  status: string;
  data?: Array<{ markdown: string; metadata: Record<string, any> }>;
}

export interface FirecrawlExtractResult {
  json: any;
  markdown: string;
  metadata: Record<string, any>;
}

@Injectable()
export class FirecrawlService {
  private readonly logger = new Logger(FirecrawlService.name);
  private readonly apiUrl = 'https://api.firecrawl.dev/v1';
  private readonly apiKey = process.env.FIRECRAWL_API_KEY;

  private getHeaders(customApiKey?: string) {
    const key = customApiKey || this.apiKey;
    if (!key) {
      throw new InternalServerErrorException(
        'Nenhuma chave da API Firecrawl configurada. Configure sua chave em "Chaves de API" no topo da página.',
      );
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    };
  }

  private normalizeUrl(rawUrl: string): string {
    let url = rawUrl.trim();
    // ACM Digital Library epdf viewer embeds PDF dynamically; the canonical /doi/ page has the full open-access text
    if (url.includes('dl.acm.org/doi/epdf/')) {
      url = url.replace('dl.acm.org/doi/epdf/', 'dl.acm.org/doi/');
    }
    return url;
  }

  async scrape(rawUrl: string, customApiKey?: string): Promise<FirecrawlScrapeResult> {
    const url = this.normalizeUrl(rawUrl);
    try {
      const response = await fetch(`${this.apiUrl}/scrape`, {
        method: 'POST',
        headers: this.getHeaders(customApiKey),
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          timeout: 60000,
          waitFor: 3000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Firecrawl scrape error: ${error}`);
        throw new InternalServerErrorException('Erro ao processar página no Firecrawl');
      }

      const data = await response.json();
      return {
        markdown: data.data?.markdown || '',
        metadata: data.data?.metadata || {},
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Firecrawl scrape failed: ${error}`);
      throw new InternalServerErrorException('Falha na conexão com Firecrawl');
    }
  }

  async crawl(rawUrl: string, limit: number = 10, customApiKey?: string): Promise<FirecrawlCrawlResult> {
    const url = this.normalizeUrl(rawUrl);
    try {
      const response = await fetch(`${this.apiUrl}/crawl`, {
        method: 'POST',
        headers: this.getHeaders(customApiKey),
        body: JSON.stringify({
          url,
          limit,
          scrapeOptions: {
            formats: ['markdown'],
            timeout: 60000,
            waitFor: 3000,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Firecrawl crawl error: ${error}`);
        throw new InternalServerErrorException('Erro ao iniciar crawl no Firecrawl');
      }

      const data = await response.json();
      const jobId = data.id;

      // Poll Firecrawl until crawl completes (up to 60 seconds)
      const maxAttempts = 20;
      let pages: Array<{ markdown: string; metadata: Record<string, any> }> = [];

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const checkRes = await fetch(`${this.apiUrl}/crawl/${jobId}`, {
          headers: this.getHeaders(customApiKey),
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.status === 'completed') {
            pages = checkData.data || [];
            break;
          }
          if (checkData.status === 'failed' || checkData.status === 'cancelled') {
            this.logger.error(`Crawl failed: ${checkData.error}`);
            break;
          }
        }
      }

      // If crawl returned 0 pages (e.g. single URL or blocked recursion), fallback to direct scrape of the URL
      if (pages.length === 0) {
        this.logger.log(`Crawl returned 0 pages, falling back to single scrape for ${url}`);
        const singleScrape = await this.scrape(url, customApiKey);
        if (singleScrape.markdown) {
          pages = [{ markdown: singleScrape.markdown, metadata: singleScrape.metadata }];
        }
      }

      return {
        jobId,
        status: 'completed',
        data: pages,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Firecrawl crawl failed: ${error}`);
      throw new InternalServerErrorException('Falha na conexão com Firecrawl');
    }
  }

  async extract(
    rawUrl: string,
    prompt?: string,
    schema?: Record<string, any>,
    customApiKey?: string,
  ): Promise<FirecrawlExtractResult> {
    const url = this.normalizeUrl(rawUrl);
    try {
      const jsonFormat: Record<string, any> = {
        type: 'json',
      };

      if (schema && Object.keys(schema).length > 0) {
        jsonFormat.schema = schema;
      } else if (prompt && prompt.trim()) {
        jsonFormat.prompt = prompt.trim();
      } else {
        jsonFormat.prompt =
          'Extract all key information, headings, main sections and data into structured JSON';
      }

      // Modern Firecrawl v2 scrape endpoint supports synchronous structured JSON extraction
      const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
        method: 'POST',
        headers: this.getHeaders(customApiKey),
        body: JSON.stringify({
          url,
          formats: ['markdown', jsonFormat],
          timeout: 60000,
          waitFor: 3000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Firecrawl v2 extract error: ${error}`);
        throw new InternalServerErrorException('Erro na extração JSON via Firecrawl');
      }

      const data = await response.json();
      return {
        json: data.data?.json || null,
        markdown: data.data?.markdown || '',
        metadata: data.data?.metadata || {},
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Firecrawl extract failed: ${error}`);
      throw new InternalServerErrorException('Falha na conexão com Firecrawl');
    }
  }
}
