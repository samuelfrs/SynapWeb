# SynapWeb — Web-to-LLM Intelligence Engine

Motor inteligente de Web Scraping & Crawling que converte qualquer site, documentação ou PDF da web em **Markdown limpo** ou **JSON estruturado** pronto para LLMs, com chat RAG integrado via Google Gemini.

## ✨ Features

- **Scrape URL** — Extrai conteúdo de qualquer URL em Markdown limpo
- **Crawl Docs** — Varre documentações inteiras recursivamente
- **Extract JSON** — Extração estruturada com schema definido pelo usuário
- **Chat RAG** — Converse com o conteúdo extraído via Gemini
- **Histórico** — Todas as extrações salvas e acessíveis
- **Export** — Download em `.md`, `.json` ou cópia rápida

## 🏗 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Scraping | Firecrawl API |
| IA/RAG | Google Gemini (`@google/genai`) |
| Deploy | Vercel (Serverless) |

## 📁 Estrutura

```
SynapWeb/
├── frontend/    # Next.js 15 (App Router)
├── backend/     # NestJS (API Serverless)
└── README.md
```

## 🚀 Setup Local

### Pré-requisitos
- Node.js 20+
- Chaves de API: Firecrawl, Google Gemini, Supabase

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Preencha as variáveis
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Preencha as variáveis
npm run dev
```

## 📄 Licença

MIT
