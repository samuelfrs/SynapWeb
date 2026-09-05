# SynapWeb — Web-to-LLM Intelligence Engine

> Motor inteligente de Web Scraping & Crawling que converte qualquer site, documentação técnica ou PDF da web em **Markdown limpo** ou **JSON estruturado** pronto para alimentar LLMs e pipelines de RAG, com chat integrado via Google Gemini e arquitetura **Local-First (Zero Database)**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![NestJS 11](https://img.shields.io/badge/NestJS-11-red?logo=nestjs)](https://nestjs.com)

🔗 **Acesse a Aplicação em Produção:** [https://synapwebv1.vercel.app](https://synapwebv1.vercel.app)  
📡 **API Endpoint:** [https://synap-web-api.vercel.app](https://synap-web-api.vercel.app)

---

## ✨ Funcionalidades Principais

- 🌐 **Scrape URL:** Extrai o conteúdo de uma página única ou link direto para PDF em Markdown limpo para LLMs, removendo menus, banners, anúncios e scripts.
- 📎 **Anexar Arquivos & Print Direto (Ctrl+V):** Arraste e solte arquivos locais (PDF, Imagens PNG/JPG/WebP, TXT, CSV, Markdown, JSON) ou aperte `Ctrl+V` em qualquer lugar da tela para colar um print de tela, processado via Gemini Multimodal.
- 🔬 **Engenharia Reversa Acadêmica & Resgate Anti-Bot:** Quando links científicos são protegidos por paywall ou bloqueados por proteção anti-bot (como Cloudflare), o SynapWeb identifica o DOI, busca preprints gratuitos e abertos autorizados via Unpaywall API e gera uma reconstrução sintética de literatura com base no consenso científico e citações acadêmicas.
- 📁 **Crawl Docs:** Varre documentações inteiras recursivamente em lote (até 10 subpáginas) e consolida em um documento único pronto para RAG.
- 🏷️ **Extrair JSON (com IA):** Extração de dados estruturados a partir de prompts em linguagem natural (ex: *"Extraia título, resumo, tópicos e preços"*) com fallback inteligente via Google Gemini.
- 💬 **Chat RAG com o Documento:** Converse diretamente com o conteúdo extraído usando Google Gemini, com respostas fundamentadas estritamente no texto e memória contextual.
- ⚡ **Ações Rápidas no Chat:** Sugestões de 1 clique para gerar resumo executivo, extrair conclusões/dados, traduzir ou montar um FAQ completo.
- ✨ **Copiar Pronto para LLM:** Botão que formata o documento dentro de um prompt de sistema otimizado, pronto para colar no **ChatGPT, Claude ou Cursor**.
- 🔑 **BYOK (Bring Your Own Key):** Modal no cabeçalho que permite a qualquer visitante conectar suas próprias chaves gratuitas do Firecrawl e Gemini, viabilizando deploy público sem custos para o proprietário.
- 💡 **Guia Interativo ("Como Usar"):** Tutorial passo a passo integrado na página inicial e no cabeçalho para guiar novos usuários.
- 💾 **Arquitetura Local-First:** Histórico e chats salvos no `localStorage` do navegador com total privacidade, além de botões de **Exportar/Importar Backup em JSON**.
- 📊 **Contador de Tokens:** Estimativa em tempo real com indicador de compatibilidade para janelas de contexto de LLMs.

---

## 🏗 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI / Base UI, Lucide Icons |
| **Backend** | NestJS, TypeScript, Architecture Stateless / Serverless |
| **Scraping** | Firecrawl v2 API (Scrape, Crawl e Extração JSON) |
| **Inteligência Artificial** | Google Gemini API (`gemini-3.1-flash-lite-preview` com fallback dinâmico) |
| **Armazenamento** | LocalStorage no navegador (Local-First com retenção LRU) |
| **Deploy** | Vercel (Monorepo Serverless) |

---

## 📁 Estrutura do Projeto

```text
SynapWeb/
├── package.json              # Scripts centrais (dev:backend, dev:frontend)
├── README.md                 # Documentação principal
├── .gitignore                # Regras de versionamento
│
├── backend/                  # API NestJS Serverless
│   ├── src/
│   │   ├── main.ts           # Entrypoint dual (local 3001 e Vercel Serverless)
│   │   ├── scraper/          # Endpoints de Scrape, Crawl e Extração JSON (v2)
│   │   └── ai/               # Chat RAG e extração JSON com Gemini
│   ├── vercel.json           # Configuração de deploy serverless
│   ├── tsconfig.json         # TypeScript ~6.0.0
│   └── .env.example          # Exemplo de variáveis locais
│
└── frontend/                 # Next.js 15 (App Router, Tailwind, Shadcn)
    ├── src/
    │   ├── app/              # Rotas: /, /history, /result/[id]
    │   ├── components/       # Header, ChatPanel, ApiKeysDialog, HowToUseDialog, viewers
    │   └── lib/              # API Client (BYOK headers), Storage (LocalStorage + Backup)
    └── .env.example          # Exemplo de variáveis frontend
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js 20+**
- **npm**

### 1. Clonar o Repositório
```bash
git clone https://github.com/samuelfrs/SynapWeb.git
cd SynapWeb
```

### 2. Instalar Dependências
```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 3. Configurar Variáveis de Ambiente

Crie o arquivo `backend/.env`:
```env
FIRECRAWL_API_KEY="fc-sua-chave-aqui"
GEMINI_API_KEY="sua-chave-gemini-aqui"
ALLOWED_ORIGINS="http://localhost:3000"
```

Crie o arquivo `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

*(Nota: O banco de dados PostgreSQL é 100% opcional, pois o sistema opera nativamente em modo Local-First/Stateless).*

### 4. Iniciar os Servidores

Abra dois terminais na raiz do projeto:

* **Terminal 1 (Backend):**
  ```bash
  npm run dev:backend
  # Rodando em http://localhost:3001
  ```

* **Terminal 2 (Frontend):**
  ```bash
  npm run dev:frontend
  # Rodando em http://localhost:3000
  ```

Abra seu navegador em [http://localhost:3000](http://localhost:3000).

---

## ☁️ Como Fazer Deploy na Vercel

O SynapWeb foi desenvolvido em formato monorepo serverless:

1. **Deploy do Backend (API NestJS):**
   - Importe o repositório na Vercel.
   - Nome do projeto: `synap-web-api`.
   - **Root Directory:** selecione `backend`.
   - **Framework Preset:** `Other`.
   - Clique em **Deploy** e copie o domínio gerado (ex: `https://synap-web-api.vercel.app`).

2. **Deploy do Frontend (Next.js 15):**
   - Importe o mesmo repositório na Vercel.
   - Nome do projeto: `synap-web-frontend`.
   - **Root Directory:** selecione `frontend`.
   - **Framework Preset:** `Next.js`.
   - Em **Environment Variables**, adicione:
     - `NEXT_PUBLIC_API_URL` = `https://synap-web-api.vercel.app` *(tipo Config)*.
   - Clique em **Deploy**.

---

## 🔑 Obtenção de Chaves Gratuitas (BYOK)

Qualquer usuário pode utilizar a ferramenta gratuitamente com suas próprias cotas:
* **Firecrawl API:** Crie uma conta gratuita em [firecrawl.dev](https://www.firecrawl.dev) para créditos de scraping e crawling.
* **Google Gemini API:** Obtenha uma chave 100% gratuita no [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
