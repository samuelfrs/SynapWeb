import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly candidateModels = [
    process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-flash-latest',
  ];

  async chatWithContent(
    content: string,
    userMessage: string,
    chatHistory: Array<{ role: string; content: string }>,
  ): Promise<string> {
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

    let lastError: Error | null = null;

    // Try each model in the fallback chain in case of temporary 503/high-demand
    for (const model of this.candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          this.logger.warn(`Model ${model} returned HTTP ${res.status}: ${errText}. Attempting next model...`);
          lastError = new Error(`Gemini API error: ${res.statusText}`);
          continue;
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } catch (err: any) {
        this.logger.warn(`Failed call to ${model}: ${err.message}. Trying next fallback model...`);
        lastError = err;
      }
    }

    this.logger.error(`All candidate Gemini models failed.`);
    throw lastError || new Error('Falha ao comunicar com os modelos Gemini.');
  }
}
