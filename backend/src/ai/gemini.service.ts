import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async chatWithContent(
    content: string,
    userMessage: string,
    chatHistory: Array<{ role: string; content: string }>,
  ): Promise<string> {
    try {
      const systemContext = `Você é um assistente técnico especializado. Responda à pergunta do usuário baseando-se estritamente no conteúdo extraído a seguir. Se a resposta não puder ser encontrada no conteúdo, diga claramente que a informação não está disponível no documento.\n\n=== CONTEÚDO EXTRAÍDO ===\n${content.substring(0, 30000)}\n=== FIM DO CONTEÚDO ===`;

      const contents = [
        { role: 'user' as const, parts: [{ text: systemContext }] },
        { role: 'model' as const, parts: [{ text: 'Entendido. Estou pronto para responder perguntas sobre o conteúdo fornecido.' }] },
        ...chatHistory.map((msg) => ({
          role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: msg.content }],
        })),
        { role: 'user' as const, parts: [{ text: userMessage }] },
      ];

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
      });

      return response.text || 'Não foi possível gerar uma resposta.';
    } catch (error) {
      this.logger.error(`Gemini error: ${error}`);
      throw error;
    }
  }
}
