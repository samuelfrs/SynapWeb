# SynapWeb — Web-to-LLM Intelligence Engine

> Motor inteligente de Web Scraping, Crawling & Síntese Científica que converte qualquer site, documentação técnica, PDF, captura de tela ou artigo científico em **Markdown limpo** ou **JSON estruturado** pronto para alimentar LLMs e pipelines de RAG, com chat contextual via Google Gemini e arquitetura **Local-First (Zero Database)**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![NestJS 11](https://img.shields.io/badge/NestJS-11-red?logo=nestjs)](https://nestjs.com)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

🔗 **Acesse a Aplicação em Produção:** [https://synapwebv1.vercel.app](https://synapwebv1.vercel.app)  
📡 **API Endpoint:** [https://synap-web-api.vercel.app](https://synap-web-api.vercel.app)

---

## ✨ Funcionalidades Completas

### 🌐 1. Scrape URL Cirúrgico
- Extrai conteúdo de páginas da web ou links diretos para PDFs em Markdown perfeitamente formatado para LLMs.
- Higienização automática ativa: remove elementos ruidosos como barras de navegação, modais, anúncios, imagens de banners publicitários, pixels 1x1, rodapés e scripts rastreadores.

### 📁 2. Crawl Recursivo de Documentações (Crawl Docs)
- Mapeia e varre recursivamente documentações técnicas inteiras em lote com opções objetivas de **10 págs** (rápido e direto) e **Max** (máximo viável suportado pela janela de conexão com resgate automático de páginas coletadas).
- Consolida o conhecimento de várias páginas em um único documento unificado, estruturado para contextualização rápida de LLMs ou indexação vetorial.

### 🏷️ 3. Extração Estruturada em JSON (com IA)
- Extração de dados complexos através de prompts em linguagem natural (ex: *"Extraia título, data de publicação, autores, metodologia, resultados e métricas"*).
- Processamento híbrido com Firecrawl v2 e fallback inteligente via Google Gemini para garantir retorno de JSON estritamente tipado e válido.

### 📎 4. Upload de Arquivos & Captura Direta via Ctrl+V (Multimodal)
- **Drag & Drop e Seletor:** Suporte a arquivos locais em múltiplos formatos: PDF, imagens (PNG, JPG, WebP), TXT, CSV, Markdown, JSON e código-fonte (TypeScript, JavaScript, Python, HTML).
- **Print de Tela Instantâneo (Clipboard):** Aperte `Ctrl+V` em qualquer lugar da tela para colar uma captura de tela e extrair dados visuais, tabelas ou diagramas.
- **Capacidade Elevada:** Suporte a arquivos e payloads Base64 de até **50MB** processados pelo Gemini Multimodal.

### 🔬 5. Reconstrução de Papers & Consulta no Meio Científico
- **Desbloqueio Legal via Open Access:** Consulta automatizada do DOI do artigo na API do Unpaywall para localizar e raspar preprints e versões abertas autorizadas (arXiv, bioRxiv, repositórios institucionais).
- **Dossiê de Reconstrução por Literatura & Citações:** Caso o artigo esteja sob paywall restrito ou bloqueio anti-bot (Cloudflare/WAF), o motor utiliza a literatura científica indexada, papers derivados e consenso acadêmico para reconstruir a estrutura integral do estudo (tese, metodologia, métricas e recepção acadêmica).
- **Botão de Resgate Inteligente:** Se um scrape sofrer bloqueio anti-bot ou restrição de acesso em links acadêmicos, a interface exibe sugestão automática de 1 clique para ativar a Reconstrução Científica.

### 💬 6. Chat RAG com o Documento
- Converse interativamente com o documento extraído usando Google Gemini (`gemini-3.6-flash`, `gemini-3.1-flash-lite-preview`, `gemini-3.5-flash` em cascata).
- Respostas fundamentadas estritamente no conteúdo extraído, com retenção de memória de conversação.
- **Ações Rápidas em 1 Clique:** Atalhos rápidos para gerar resumo executivo, sintetizar conclusões, traduzir ou elaborar um FAQ completo.

### ⚡ 7. Otimização e Cópia Especializada para LLMs (Três Modos com Guia Integrado)
- **📋 Copiar Puro:** Cópia fiel do Markdown ou JSON exatamente como extraído, sem prompts artificiais, para salvar em arquivos locais, notas (Obsidian, Notion) ou código.
- **⚡ Copiar p/ LLM (Resumido):** Sanitiza links irrelevantes, elimina imagens e formatações pesadas e aplica algoritmo de excerto inteligente (início estruturante + desfecho com conclusões) delimitado a **~2.100 tokens (~8.500 caracteres)**. Garante compatibilidade imediata com limites de contexto de chats gratuitos como ChatGPT Free, Claude Free, DeepSeek ou extensões de IDE como Cursor.
- **📜 Copiar p/ LLM (Completo):** Mantém o conteúdo 100% na íntegra com prompt de sistema pronto para modelos de contexto amplo (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro).
- **Download em Formato Bruto:** Botão para download direto do arquivo em `.md` ou `.json`.
- **Ajuda de Cópia na Interface:** Card explicativo interativo orientando qual formato escolher conforme a janela do modelo desejado.

### 🔑 8. Arquitetura BYOK (Bring Your Own Key)
- Modal integrado no cabeçalho permitindo aos usuários informarem suas próprias chaves de API da **Firecrawl** e **Google Gemini**.
- As chaves são mantidas exclusivamente no navegador (`localStorage`) e enviadas via cabeçalhos HTTP seguros (`X-Firecrawl-Key`, `X-Gemini-Key`), permitindo que a aplicação seja hospedada publicamente com custo zero para o mantenedor.

### 💾 9. Arquitetura Local-First & Privacidade de Dados
- Histórico completo de jobs, conteúdos e sessões de chat mantidos diretamente no navegador (`localStorage`), sem dependência de banco de dados centralizado.
- **Backup e Portabilidade:** Ferramentas nativas para exportar o histórico completo em JSON e importar em outro dispositivo ou navegador.
- Algoritmo de limpeza LRU inteligente para evitar estouro da cota de armazenamento local.

---

## 🎓 Uso no Meio Científico: Consulta, Pesquisa e Reconstrução de Papers

O SynapWeb foi desenhado como um aliado indispensável para **pesquisadores, acadêmicos, estudantes de pós-graduação e cientistas de dados**. A rotina científica frequentemente enfrenta barreiras como *paywalls*, interfaces cheias de scripts pesados, documentos complexos e bloqueios de acesso que atrasam revisões bibliográficas.

### 1. Resgate Aberto e Legítimo (Open Access / Unpaywall)
Quando a URL de uma publicação (Nature, IEEE, Springer, Elsevier, etc.) é fornecida:
- O SynapWeb detecta o **DOI (Digital Object Identifier)** automaticamente via expressão regular ou metadados da página.
- Faz uma requisição à base de dados aberta do **Unpaywall** para verificar se existe uma versão legalmente disponível (preprints no arXiv, PubMed Central, repositórios de universidades ou versões publicadas autorizadas com licença Creative Commons).
- Se encontrada, o SynapWeb recupera o artigo completo e o converte em Markdown estruturado, liberando o texto para leitura e chat imediato.

### 2. Reconstrução Sintética por Literatura & Consenso Científico
Quando um artigo é fechado por paywall rígido ou bloqueado por firewalls de bot:
- O motor acadêmico sintetiza a literatura correlata usando inteligência artificial fundamentada no conhecimento consolidado da comunidade científica.
- Em vez de alucinar o texto restrito, o modelo mapeia como o paper é citado, discutido e referenciado por outros autores em trabalhos públicos indexados.
- É gerado um **Dossiê de Reconstrução Científica** padronizado, composto por:
  1. **Identificação Formal:** DOI, título canônico, autores e área de estudo.
  2. **Proposta Central & Problema:** A dor que motivou a pesquisa e a hipótese apresentada.
  3. **Metodologia & Arquitetura:** Algoritmos, conjuntos de dados, modelos teóricos e pipelines experimentais registrados pela literatura.
  4. **Principais Descobertas & Métricas:** Resultados quantitativos e qualitativos relatados pelos pares.
  5. **Consenso Científico & Repercussão:** Como a comunidade avaliou a publicação, críticas relevantes e derivações posteriores.
  6. **Leituras Recomendadas & Preprints Correlatos:** Sugestões de trabalhos abertos para leitura complementar.

### 3. Extração Estruturada de Metodologias e Resultados (JSON)
Em revisões sistemáticas da literatura (SLR), pesquisadores podem utilizar a aba **Extrair JSON** com schemas sob medida:
```json
{
  "titulo": "string",
  "amostra_avaliada": "number",
  "metodologia": "string",
  "metricas_chave": ["string"],
  "conclusoes_principais": "string"
}
```
Isso possibilita consolidar tabelas comparativas de dezenas de artigos com agilidade.

### 4. RAG Local para Sabatinar Artigos
Através do chat contextual integrado:
- O pesquisador pode fazer perguntas complexas diretamente ao artigo: *"Qual foi o tamanho amostral do grupo de controle?"*, *"Quais limitações os próprios autores reconhecem?"*, *"Compare esta metodologia com o estado da arte tradicional"*.
- As respostas são restritas ao contexto do estudo, acelerando revisões e escrita de artigos científicos.

---

## 🏗 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS 4, Radix UI / Shadcn UI, Lucide Icons |
| **Backend** | NestJS 11, Express (body parser configurado para 50MB), TypeScript, Arquitetura Stateless / Serverless |
| **Scraping** | Firecrawl v2 API (Scrape, Crawl e Extração de Entidades JSON) |
| **Inteligência Artificial** | Google Gemini API (`gemini-3.6-flash`, `gemini-3.1-flash-lite-preview`, `gemini-3.5-flash` em cadeia de fallback) |
| **Descoberta Científica** | Unpaywall REST API (rastreamento de DOIs e links Open Access autorizados) |
| **Armazenamento** | LocalStorage no navegador (Local-First com retenção LRU e import/export) |
| **Deploy** | Vercel (Monorepo Serverless) |

---

## 📁 Estrutura do Projeto

```text
SynapWeb/
├── package.json              # Scripts centrais (dev:backend, dev:frontend, build:*)
├── README.md                 # Documentação principal
├── .gitignore                # Regras de versionamento
│
├── backend/                  # API NestJS Serverless
│   ├── src/
│   │   ├── main.ts           # Entrypoint dual (local 3001 e Vercel Serverless com body parser de 50MB)
│   │   ├── scraper/          # Endpoints de Scrape, Crawl, Extração JSON, Upload e Reconstrução Acadêmica
│   │   └── ai/               # Chat RAG, síntese bibliográfica e processamento multimodal com Gemini
│   ├── vercel.json           # Configuração de deploy serverless
│   ├── tsconfig.json         # TypeScript ~6.0.0
│   └── .env.example          # Exemplo de variáveis locais
│
└── frontend/                 # Next.js 16 (App Router, Tailwind 4, Shadcn)
    ├── src/
    │   ├── app/              # Rotas: /, /history, /result/[id]
    │   ├── components/       # Header, ChatPanel, FileDropzone, ApiKeysDialog, HowToUseDialog, viewers
    │   └── lib/              # API Client (BYOK headers), Storage (LocalStorage + Backup)
    └── .env.example          # Exemplo de variáveis frontend
```

---

## 🔌 Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/scrape` | Extrai página web ou PDF direto em Markdown limpo |
| `POST` | `/api/scrape/crawl` | Varre recursivamente documentações técnicas até um limite de páginas |
| `POST` | `/api/scrape/extract` | Extrai JSON estruturado com prompt e schema personalizado |
| `POST` | `/api/scrape/upload` | Processa arquivos locais ou prints Base64 via Gemini Multimodal |
| `POST` | `/api/scrape/reconstruct` | Resgata DOI via Unpaywall ou gera síntese acadêmica por literatura |
| `POST` | `/api/chat/:jobId` | Envia pergunta no chat fundamentada estritamente no documento extraído |

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

2. **Deploy do Frontend (Next.js 16):**
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
