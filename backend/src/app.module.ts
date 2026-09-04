import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ScraperModule } from './scraper/scraper.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [PrismaModule, ScraperModule, AiModule],
})
export class AppModule {}
