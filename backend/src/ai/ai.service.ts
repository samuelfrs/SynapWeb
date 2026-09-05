import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly gemini: GeminiService) {}

  async sendMessage(
    jobId: string,
    userMessage: string,
    clientContent?: string,
    clientHistory?: Array<{ role: string; content: string }>,
    customGeminiKey?: string,
  ) {
    const content = clientContent || '';
    const history: Array<{ role: string; content: string }> = clientHistory || [];

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

    return {
      id: randomUUID(),
      jobId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date().toISOString(),
    };
  }

  async getMessages(jobId: string) {
    return [];
  }
}
