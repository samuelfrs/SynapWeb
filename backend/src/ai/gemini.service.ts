import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  async chatWithContent(
    content: string,
    userMessage: string,
    chatHistory: Array<{ role: string; content: string }>,
  ): Promise<string> {
    try {
      const systemContext = `Você é um assistente técnico especializado. Responda à pergunta do usuário baseando-se estritamente no conteúdo extraído a seguir. Se a resposta não puder ser encontrada no conteúdo, diga claramente que a informação não está disponível no documento.\n\n=== CONTEÚDO EXTRAÍDO ===\n${content.substring(0, 30000)}\n=== FIM DO CONTEÚDO ===`;

      const contents = [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'Entendido. Estou pronto para responder perguntas sobre o conteúdo fornecido.' }] },
        ...chatHistory.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Gemini API error: ${errText}`);
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Não foi possível gerar uma resposta.'
      );
    } catch (error) {
      this.logger.error(`Gemini error: ${error}`);
      throw error;
    }
  }
}
