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
    customApiKey?: string,
  ): Promise<string> {
    const key = customApiKey || this.apiKey;
    if (!key) {
      throw new Error(
        'Nenhuma chave da API Gemini configurada. Configure sua chave em "Chaves de API" no topo da página.',
      );
    }

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
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
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

  async extractJsonFromContent(
    content: string,
    prompt?: string,
    schema?: Record<string, any>,
    customApiKey?: string,
  ): Promise<any> {
    const key = customApiKey || this.apiKey;
    if (!key) return null;

    const systemPrompt = `Você é um extrator de dados altamente preciso.
Analise o texto a seguir e extraia as informações no formato JSON estruturado.
${prompt ? `Instruções específicas: ${prompt}` : 'Extraia título, resumo, tópicos principais, entidades e metadados estruturados.'}
${schema ? `Esquema JSON esperado: ${JSON.stringify(schema)}` : ''}

Retorne ESTRITAMENTE um objeto JSON válido, sem tags markdown (\`\`\`json), sem explicações.

=== CONTEÚDO ===
${content.substring(0, 35000)}
=== FIM DO CONTEÚDO ===`;

    const contents = [{ role: 'user', parts: [{ text: systemPrompt }] }];

    for (const model of this.candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          },
        );

        if (!res.ok) continue;

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text);
          } catch {
            const clean = text
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/, '')
              .replace(/\s*```$/, '')
              .trim();
            return JSON.parse(clean);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini JSON extraction error on ${model}: ${err.message}`);
      }
    }

    return null;
  }

  async processMultimodalFile(
    base64: string,
    mimeType: string,
    prompt?: string,
    customApiKey?: string,
  ): Promise<string> {
    const key = customApiKey || this.apiKey;
    if (!key) {
      throw new Error(
        'Nenhuma chave da API Gemini configurada. Configure sua chave em "Chaves de API" no topo da página.',
      );
    }

    const systemInstruction = `Você é o motor de extração multimodal do SynapWeb.
Transcreva e estruture todo o conteúdo textual, tabelas, dados, diagramas e fórmulas presentes neste arquivo anexado em formato Markdown cirúrgico e limpo, perfeitamente otimizado para pipelines de LLMs e RAG.
${prompt ? `Instruções do usuário: ${prompt}\n` : ''}
Diretrizes:
- Transcreva tabelas usando sintaxe Markdown padrão (| col1 | col2 |).
- Mantenha títulos, subtítulos, cabeçalhos e listas numeradas ou bullet points.
- Se houver gráficos ou infográficos, descreva detalhadamente os eixos, valores e conclusões.
- Inicie a resposta diretamente pelo título ou conteúdo principal, sem saudações ou meta-comentários.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          {
            text: systemInstruction,
          },
        ],
      },
    ];

    for (const model of this.candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          this.logger.warn(`Gemini multimodal attempt on ${model} failed (${res.status}): ${errText}`);
          continue;
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err: any) {
        this.logger.warn(`Gemini multimodal error on ${model}: ${err.message}`);
      }
    }

    throw new Error('Não foi possível processar o arquivo anexado via Gemini.');
  }

  async synthesizeLiterature(
    doi: string,
    title?: string,
    rawUrl?: string,
    customApiKey?: string,
  ): Promise<string> {
    const key = customApiKey || this.apiKey;
    if (!key) {
      throw new Error(
        'Nenhuma chave da API Gemini configurada. Configure sua chave em "Chaves de API" no topo da página.',
      );
    }

    const systemPrompt = `Você é um pesquisador sênior e especialista em síntese de literatura acadêmica.
Um artigo científico com paywall ou acesso restrito foi solicitado pelo usuário.
Sua missão é realizar uma RECONSTRUÇÃO CIENTÍFICA ESTRUTURADA E FUNDAMENTADA deste artigo com base no conhecimento consolidado da literatura, citações em outros papers acadêmicos e consenso da comunidade científica.

Identificadores fornecidos:
- DOI: ${doi || 'Não informado'}
- Título/Tema: ${title || 'Não informado'}
- URL original: ${rawUrl || 'Não informado'}

Estruture sua resposta estritamente no seguinte formato Markdown:

# 🔍 Dossiê de Reconstrução Científica por Literatura

> **Aviso de Transparência:** Este documento foi reconstruído sinteticamente a partir de literatura acadêmica indexada, trabalhos que citam a pesquisa e consenso científico registrado, em conformidade com o princípio de Uso Justo (*Fair Use*) e análise bibliográfica.

## 📌 1. Identificação da Pesquisa
- **DOI:** ${doi || 'N/A'}
- **Título Identificado:** (coloque o título completo oficial se conhecido)
- **Área / Domínio:** (ex: Inteligência Artificial, Engenharia de Software, etc.)

## 🎯 2. Proposta Central & Problema Abordado
(Descreva o problema que os autores buscaram resolver e a tese/hipótese principal apresentada).

## 🔬 3. Metodologia & Arquitetura (Descrita na Literatura)
(Explique as abordagens técnicas, modelos, pipelines, conjuntos de dados ou experimentos conhecidos e citados por terceiros sobre este artigo).

## 📊 4. Principais Descobertas & Métricas Conhecidas
(Sintetize os resultados relatados, ganhos de desempenho ou conclusões teóricas/práticas).

## ⚖️ 5. Consenso Científico & Repercussão
(Como a comunidade de pesquisadores recebeu este trabalho? Quais foram os trabalhos subsequentes mais notáveis que expandiram ou criticaram esta pesquisa?).

## 📚 6. Leituras Recomendadas & Fontes Abertas Relacionadas
(Cite artigos correlatos abertos ou preprints similares no arXiv que aprofundam o mesmo tema).`;

    const contents = [{ role: 'user', parts: [{ text: systemPrompt }] }];

    for (const model of this.candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          },
        );

        if (!res.ok) continue;

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err: any) {
        this.logger.warn(`Gemini literature synthesis error on ${model}: ${err.message}`);
      }
    }

    throw new Error('Falha ao gerar síntese bibliográfica com Gemini.');
  }
}
