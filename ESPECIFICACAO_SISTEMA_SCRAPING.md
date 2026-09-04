# Especificação Técnica e Arquitetura: SynapWeb (Web-to-LLM Intelligence Engine)

Este documento é a especificação técnica e arquitetural completa para o desenvolvimento da plataforma **SynapWeb** (antigo ScrapeFlow AI), uma ferramenta e SaaS de **Web Scraping & Crawling inteligente** que conecta e sintetiza qualquer site, documentação técnica ou PDF da web em **Markdown limpo ou JSON estruturado pronto para LLMs**, com suporte a chat/RAG alimentado por IA.

---

## 1. Visão Geral do Produto

O **SynapWeb** (uma fusão de *Synapse* + *Web*) atua como uma "sinapse" inteligente entre o conteúdo bruto da web e modelos de linguagem/desenvolvedores:

1. **Scrape Individual (Single URL):**
   - Recebe uma URL e extrai o conteúdo convertendo-o em **Markdown perfeitamente limpo** (removendo menus, banners, rodapés e anúncios).
   - Suporte a links diretos de arquivos **PDF** da web.
2. **Crawl Recursivo de Domínio/Docs:**
   - Varre documentações inteiras ou subcaminhos de sites de forma profunda e assíncrona, mapeando e extraindo todas as subpáginas em lotes de Markdown/JSON.
3. **Structured Extract (Modo JSON com IA):**
   - O usuário fornece a URL e define campos ou um schema JSON/Zod (ex: `titulo`, `preco`, `autor`, `topicos`). A plataforma extrai e valida os dados estruturados via Firecrawl + Gemini.
4. **Chat com os Dados Extraídos (RAG Engine):**
   - Janela de chat integrada onde o usuário pode conversar diretamente com os documentos/sites raspados, com respostas fundamentadas pelo **Google Gemini**.
5. **Histórico, Exportação & API:**
   - Visualização em tempo real (com syntax highlighting de Markdown e visualizador de JSON em árvore), download em `.md`, `.json` ou cópia rápida para a área de transferência.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Infraestrutura / Deploy |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn UI, Lucide Icons, Monaco Editor / Syntax Highlighting | Vercel |
| **Backend API** | NestJS (modular: Controllers, Services, DTOs com `class-validator`), TypeScript | Vercel (Serverless Function via `@vercel/node`) |
| **Banco de Dados** | PostgreSQL gerenciado via **Supabase** (usando isolamento por **Schemas**) | Supabase |
| **ORM & Migrations** | Prisma ORM | Prisma Client nos serviços NestJS |
| **Motor de Scraping** | Firecrawl API (Node SDK / REST API para scrape, crawl e extração) | Firecrawl Cloud / Self-hosted |
| **Motor de IA & RAG** | Google Gemini API (`@google/genai` via Google AI Studio) | Google Cloud (Tier Gratuito) |
| **Autenticação & Sessão** | Supabase Auth ou NextAuth / JWT | Supabase / Vercel |

---

## 3. Estratégia de Banco de Dados: Isolamento por Schemas no Supabase

Para respeitar os limites de projetos gratuitos do Supabase e reaproveitar o projeto existente onde está o **HomeFinance**, será utilizada a estratégia de **Multi-Schema** no PostgreSQL.

### 3.1. Renomeação do Projeto no Supabase
- O projeto atualmente nomeado como **HomeFinance** no Dashboard do Supabase pode ser renomeado com segurança para:
  > **`Shared-Core-DB`** ou **`Dev-Workspace-DB`**
- > [!IMPORTANT]
  > **Garantia de Não-Quebra:** Renomear o título visual do projeto no dashboard **não afeta em nada** as credenciais, o host, a porta, as senhas ou as tabelas existentes. O sistema do HomeFinance continuará funcionando 100% sem interrupções.

### 3.2. Criação do Schema Dedicado
Execute o seguinte comando no SQL Editor do projeto no Supabase:
```sql
-- Cria o schema dedicado para a ferramenta de scraping/IA
CREATE SCHEMA IF NOT EXISTS scraping;
```

* **HomeFinance:** Continua consumindo normalmente o schema padrão `public`.
* **ScrapeFlow (Novo Projeto):** Operará exclusivamente no schema `scraping`. Zero conflito de tabelas.

### 3.3. Configuração do Prisma no NestJS
No arquivo `prisma/schema.prisma` da nova API NestJS, declare o multiSchema:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["scraping"]
}

model ScrapeJob {
  id           String      @id @default(uuid())
  url          String
  mode         ScrapeMode  @default(SCRAPE) // SCRAPE, CRAWL, EXTRACT
  status       JobStatus   @default(PENDING) // PENDING, PROCESSING, COMPLETED, FAILED
  format       ExportType  @default(MARKDOWN) // MARKDOWN, JSON
  
  // Conteúdo gerado
  contentMd    String?     @db.Text
  contentJson  Json?
  metadata     Json?       // Title, description, HTTP status, word count, tokens
  error        String?

  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  chatMessages ChatMessage[]

  @@map("scrape_jobs")
  @@schema("scraping")
}

model ChatMessage {
  id          String     @id @default(uuid())
  jobId       String
  job         ScrapeJob  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  role        String     // "user" | "assistant"
  content     String     @db.Text
  createdAt   DateTime   @default(now())

  @@map("chat_messages")
  @@schema("scraping")
}

enum ScrapeMode {
  SCRAPE
  CRAWL
  EXTRACT

  @@schema("scraping")
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED

  @@schema("scraping")
}

enum ExportType {
  MARKDOWN
  JSON

  @@schema("scraping")
}
```

Nas variáveis de ambiente (`.env` do NestJS):
```env
DATABASE_URL="postgresql://postgres:[SUA-SENHA]@[HOST-DO-SUPABASE]:5432/postgres?schema=scraping"
DIRECT_URL="postgresql://postgres:[SUA-SENHA]@[HOST-DO-SUPABASE]:5432/postgres?schema=scraping"
```

---

## 4. Arquitetura do Repositório & Deploy na Vercel (Monorepo)

O projeto será estruturado como um **Monorepo em um único repositório no GitHub**, contendo pastas isoladas para frontend e backend:

```text
scrapeflow/
├── frontend/             # Next.js 15 (App Router, Tailwind, Shadcn UI)
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/              # NestJS (API modular Serverless)
│   ├── src/
│   │   └── main.ts       # Adapter Express para Vercel
│   ├── prisma/
│   │   └── schema.prisma # Schema 'scraping' no Supabase
│   ├── vercel.json       # Configuração de build Serverless
│   ├── package.json
│   └── ...
├── README.md
└── .gitignore
```

### 4.1. Como funciona o Deploy na Vercel com Monorepo
No painel da Vercel, você importará esse mesmo repositório do GitHub criando **dois projetos vinculados**:

1. **Projeto 1: Frontend (`scrapeflow-web`)**
   - **Root Directory:** selecione `frontend`
   - **Framework Preset:** Next.js
   - **Environment Variables:** `NEXT_PUBLIC_API_URL=https://api-scrapeflow.vercel.app`

2. **Projeto 2: Backend (`api-scrapeflow`)**
   - **Root Directory:** selecione `backend`
   - **Framework Preset:** Other
   - **Environment Variables:** `DATABASE_URL`, `FIRECRAWL_API_KEY`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS`

---

## 5. Backend NestJS Serverless na Vercel

O backend NestJS roda dentro da pasta `/backend` como uma Serverless Function sob demanda.

### 5.1. Entrypoint Serverless (`backend/src/main.ts`)
```typescript
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express, { Express } from 'express';

const server: Express = express();

export const createServer = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return server;
};

// Handler executado pela Vercel Serverless
export default async (req: any, res: any) => {
  await createServer();
  server(req, res);
};
```

### 5.2. Arquivo `backend/vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/main.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/main.ts"
    }
  ]
}
```

---

## 6. Módulos Centrais do Backend NestJS

### 6.1. `ScraperModule` & `FirecrawlService`
Responsável pela comunicação com o Firecrawl:
- **`scrapeUrl(url: string)`**: Chama a API do Firecrawl para obter Markdown puro (suporta SPAs em JS e links de arquivos PDF).
- **`crawlDomain(url: string, limit?: number)`**: Dispara jobs assíncronos de crawl recursivo para baixar várias páginas de uma documentação.
- **`extractJson(url: string, promptOrSchema: any)`**: Extrai diretamente objetos JSON com tipagem estrita com base no conteúdo da URL.

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class FirecrawlService {
  private readonly apiUrl = 'https://api.firecrawl.dev/v1';
  private readonly apiKey = process.env.FIRECRAWL_API_KEY;

  async scrape(url: string) {
    const response = await fetch(`${this.apiUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Erro ao processar página no Firecrawl');
    }

    const data = await response.json();
    return {
      markdown: data.data.markdown,
      metadata: data.data.metadata,
    };
  }
}
```

### 6.2. `AiModule` & `GeminiService`
Responsável por:
1. **Sanitização & Extração Semântica:** Caso a extração JSON precise de refinamento inteligente ou sumarização de tópicos.
2. **Chat / RAG com o Conteúdo:** Responde às dúvidas do usuário utilizando o conteúdo raspado como contexto no System Prompt do Gemini.

```typescript
import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  async chatWithContent(content: string, userMessage: string, chatHistory: any[]) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Você é um assistente técnico. Responda à pergunta do usuário baseando-se estritamente no conteúdo extraído a seguir:\n\n=== CONTEÚDO ===\n${content}\n\n=== PERGUNTA ===\n${userMessage}` }
          ]
        }
      ]
    });

    return response.text;
  }
}
```

---

## 7. Frontend: Next.js 15 (App Router)

### Principais Telas & Funcionalidades da Interface:
1. **Playground Principal (`/`):**
   - Barra de input minimalista com seletor de modo (**Scrape URL**, **Crawl Docs**, **Extrair JSON**).
   - Suporte para colar links da web e links diretos de arquivos `.pdf`.
2. **Visualizador de Resultados (`/result/[id]`):**
   - **Aba Markdown:** Renderização formatada e visualizador do código fonte bruto (`.md`) com botão de copiar em 1 clique e botão de download.
   - **Aba JSON:** Árvore interativa de JSON formatado.
   - **Aba Metadados:** Título da página, tamanho em KB, contagem estimada de tokens para LLM e tempo de extração.
3. **Painel de Chat com a Página (Side-Drawer ou Split Screen):**
   - Permite ao usuário interagir com a IA para fazer perguntas sobre o documento que acabou de ser raspado sem sair da tela.
4. **Histórico de Extrações (`/history`):**
   - Lista das últimas URLs processadas, status da requisição e atalho rápido para reabrir o conteúdo.

---

## 8. Checklist de Implementação para o Agente de Desenvolvimento

- [ ] Criar o repositório Monorepo único no GitHub com as pastas `/frontend` e `/backend`.
- [ ] Renomear o projeto no Supabase (ex: para `Shared-Core-DB`) para indicar uso compartilhado.
- [ ] Executar o comando SQL no Supabase: `CREATE SCHEMA IF NOT EXISTS scraping;`.
- [ ] Obter chave gratuita do **Firecrawl** (em [firecrawl.dev](https://firecrawl.dev)).
- [ ] Obter chave gratuita do **Google Gemini** (no [Google AI Studio](https://aistudio.google.com)).
- [ ] Inicializar o backend em NestJS dentro de `/backend` (`nest new backend`).
- [ ] Configurar Prisma no NestJS com `previewFeatures = ["multiSchema"]` e schema `scraping`.
- [ ] Configurar o arquivo `backend/vercel.json` e o handler serverless para deploy na Vercel apontando o Root Directory para `backend`.
- [ ] Inicializar o frontend em Next.js 15 dentro de `/frontend` (`npx create-next-app@latest frontend`).
- [ ] Criar a interface com Tailwind + Shadcn UI e conectar aos endpoints da API.
- [ ] Fazer deploy de ambos os projetos na Vercel a partir do mesmo repositório Monorepo.

