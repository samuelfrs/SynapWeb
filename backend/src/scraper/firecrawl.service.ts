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

@Injectable()
export class FirecrawlService {
  private readonly logger = new Logger(FirecrawlService.name);
  private readonly apiUrl = 'https://api.firecrawl.dev/v1';
  private readonly apiKey = process.env.FIRECRAWL_API_KEY;

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async scrape(url: string): Promise<FirecrawlScrapeResult> {
    try {
      const response = await fetch(`${this.apiUrl}/scrape`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url,
          formats: ['markdown'],
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

  async crawl(url: string, limit: number = 10): Promise<FirecrawlCrawlResult> {
    try {
      const response = await fetch(`${this.apiUrl}/crawl`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url,
          limit,
          scrapeOptions: {
            formats: ['markdown'],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Firecrawl crawl error: ${error}`);
        throw new InternalServerErrorException('Erro ao iniciar crawl no Firecrawl');
      }

      const data = await response.json();
      return {
        jobId: data.id,
        status: data.status,
        data: data.data,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Firecrawl crawl failed: ${error}`);
      throw new InternalServerErrorException('Falha na conexão com Firecrawl');
    }
  }

  async extract(url: string, prompt?: string, schema?: Record<string, any>): Promise<any> {
    try {
      const body: Record<string, any> = {
        urls: [url],
      };

      if (prompt) body.prompt = prompt;
      if (schema) body.schema = schema;

      const response = await fetch(`${this.apiUrl}/extract`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Firecrawl extract error: ${error}`);
        throw new InternalServerErrorException('Erro na extração JSON via Firecrawl');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Firecrawl extract failed: ${error}`);
      throw new InternalServerErrorException('Falha na conexão com Firecrawl');
    }
  }
}
