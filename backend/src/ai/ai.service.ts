import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async sendMessage(
    jobId: string,
    userMessage: string,
    clientContent?: string,
    clientHistory?: Array<{ role: string; content: string }>,
    customGeminiKey?: string,
  ) {
    let content = clientContent || '';
    let history: Array<{ role: string; content: string }> = clientHistory || [];

    // If content wasn't provided by client, try to read from database if available
    if (!content) {
      try {
        const job = await this.prisma.scrapeJob.findUnique({
          where: { id: jobId },
        });
        if (job) {
          content =
            job.contentMd ||
            (job.contentJson ? JSON.stringify(job.contentJson, null, 2) : '');
        }
      } catch (e: any) {
        this.logger.warn(`Could not read job from database: ${e.message}`);
      }
    }

    // If chat history wasn't provided by client, try to read from database
    if (history.length === 0) {
      try {
        const dbHistory = await this.prisma.chatMessage.findMany({
          where: { jobId },
          orderBy: { createdAt: 'asc' },
          take: 20,
        });
        history = dbHistory.map((m) => ({ role: m.role, content: m.content }));
      } catch {
        // Fallback: empty history
      }
    }

    // Try to record user message in database if db is reachable
    try {
      await this.prisma.chatMessage.create({
        data: { jobId, role: 'user', content: userMessage },
      });
    } catch {
      // Stateless mode: non-blocking
    }

    // Check if content exists
    if (!content || content.trim().length < 20) {
      const notice =
        'Aviso: Esta extração não gerou conteúdo textual suficiente para responder perguntas (a página pode ser um leitor dinâmico ou estar vazia). Tente extrair novamente usando o modo "Scrape URL" com o link canônico do artigo ou PDF direto.';
      return {
        id: randomUUID(),
        jobId,
        role: 'assistant',
        content: notice,
        createdAt: new Date().toISOString(),
      };
    }

    // Get AI response
    const aiResponse = await this.gemini.chatWithContent(
      content,
      userMessage,
      history,
      customGeminiKey,
    );

    // Try to save assistant message in database if db is reachable
    try {
      await this.prisma.chatMessage.create({
        data: { jobId, role: 'assistant', content: aiResponse },
      });
    } catch {
      // Stateless mode: non-blocking
    }

    return {
      id: randomUUID(),
      jobId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date().toISOString(),
    };
  }

  async getMessages(jobId: string) {
    try {
      return await this.prisma.chatMessage.findMany({
        where: { jobId },
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      return [];
    }
  }
}
