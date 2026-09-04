import { IsString, IsUrl, IsOptional, IsEnum, IsObject, IsNumber, Min, Max } from 'class-validator';

export enum ScrapeModeDto {
  SCRAPE = 'SCRAPE',
  CRAWL = 'CRAWL',
  EXTRACT = 'EXTRACT',
}

export enum ExportTypeDto {
  MARKDOWN = 'MARKDOWN',
  JSON = 'JSON',
}

export class ScrapeUrlDto {
  @IsUrl({}, { message: 'URL inválida' })
  url: string;

  @IsOptional()
  @IsEnum(ExportTypeDto)
  format?: ExportTypeDto;
}

export class CrawlDomainDto {
  @IsUrl({}, { message: 'URL inválida' })
  url: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class ExtractJsonDto {
  @IsUrl({}, { message: 'URL inválida' })
  url: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsObject()
  schema?: Record<string, any>;
}
