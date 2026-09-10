# Diretrizes e Regras do SynapWeb (RULES.md)

Este documento centraliza todas as regras arquiteturais, convenções de código e diretrizes obrigatórias de desenvolvimento do projeto **SynapWeb**. Qualquer agente de IA ou desenvolvedor deve seguir rigorosamente essas regras.

---

## 🚨 REGRA DE OURO MANDATÓRIA

> **"Sempre que adicionar uma feature nova, deve-se também adicionar a usabilidade dela no 'como usar'."**
>
> Toda e qualquer nova funcionalidade, ferramenta, modo de extração ou modificação relevante na experiência do usuário deve **obrigatoriamente** ter sua usabilidade e fluxo documentados no componente `HowToUseDialog` (`frontend/src/components/how-to-use-dialog.tsx`), no `README.md` e acompanhada de sinalizações claras na interface gráfica.

---

## 🏛️ 1. Arquitetura Local-First (Zero Database)

1. **Sem Banco de Dados Centralizado:** A aplicação não deve depender de Postgres, MySQL, Mongo ou qualquer banco de dados de servidor para persistir dados de usuário.
2. **Armazenamento no Navegador:** Todo o histórico de jobs, metadados, conteúdos extraídos e conversas de chat são mantidos no `localStorage` do cliente (`lib/storage.ts`).
3. **Backup e Portabilidade:** Deve ser mantido suporte a exportação e importação do histórico em formato JSON para que o usuário possa migrar dados entre dispositivos.
4. **Política de Retenção LRU:** O `localStorage` possui limpeza automática para evitar ultrapassar os limites de cota do navegador (mantendo os 50 jobs mais recentes).
5. **Backend Stateless:** O backend em NestJS é 100% stateless e projetado para execução serverless (compatível com Vercel Functions).

---

## 🔑 2. Filosofia BYOK (Bring Your Own Key)

1. **Privacidade e Custo Zero:** O usuário insere suas próprias chaves gratuitas de API do Firecrawl e do Google AI Studio no modal de configurações.
2. **Tráfego Seguro:** As chaves nunca são salvas no disco do servidor; são enviadas a cada requisição via headers HTTP (`x-firecrawl-key`, `x-gemini-key`).
3. **Fallbacks Transparentes:** Se nenhuma chave for informada, o sistema utiliza as variáveis de ambiente locais do servidor como fallback padrão.

---

## 🧹 3. Higienização Cirúrgica de Scraping & Eliminação de Lixo

1. **Parâmetros Estritos de Scrape:** Toda chamada ao Firecrawl deve ativar:
   - `onlyMainContent: true` para ignorar menus, cabeçalhos e rodapés.
   - `excludeTags` contendo tags e classes de anúncios, banners, trackers, modais de consentimento e sidebars (`nav`, `header`, `footer`, `aside`, `.ad`, `.ads`, `.advertisement`, `.ad-box`, `.ad-banner`, `.cookie-banner`, `.social-share`, `.sidebar`, etc.).
2. **Pós-processamento com `cleanScrapedMarkdown`:**
   - Todo Markdown obtido deve passar pelo módulo `markdown-cleaner.ts`.
   - Remoção de links e imagens de anúncios (ex: DoubleClick, AdSense, Outbrain, Taboola, banners, tracking pixels `1x1`).
   - Remoção de chamadas órfãs a cookies, newsletters ou redes sociais.
   - Preservação estrita de blocos de código com tokens protegidos.

---

## 📁 4. Crawl Recursivo Inteligente e Resiliente

1. **Opções de Limite:** A interface de Crawl Docs disponibiliza apenas opções objetivas:
   - `10 págs` (Rápido & direto).
   - `Max` (Máximo possível viável com segurança, limit: 50).
2. **Resgate Gracioso de Páginas:**
   - Em documentações extensas (centenas de páginas), o crawler opera dentro da janela segura de ~55 segundos do serverless.
   - Caso o tempo expire ou ocorra interrupção, o backend entrega todas as páginas parciais já coletadas (`latestPartialPages`), em vez de emitir erro fatal.
   - Se nenhuma subpágina for retornada, realiza fallback automático para o scrape da página raiz.

---

## 🏷️ 5. Extração Estruturada JSON com Duplo Motor

1. **Extração Híbrida:** Utiliza o endpoint v2 do Firecrawl com schemas estruturados ou prompts descritivos.
2. **Fallback Gemini Automático:** Se o retorno do Firecrawl vier vazio ou incompleto, o sistema aciona automaticamente o Google Gemini para analisar o Markdown e estruturar o JSON estritamente tipado.

---

## 📎 6. Processamento Multimodal & Captura Instantânea (Ctrl+V)

1. **Upload Flexível:** Suporte a arrastar e soltar PDFs, imagens (PNG, JPG, WebP), TXT, CSV, JSON e códigos-fonte.
2. **Clipboard Direto:** Aperte `Ctrl+V` em qualquer lugar da aplicação para colar capturas de tela imediatamente.
3. **Capacidade Elevada:** Suporte a uploads de até **50MB** processados via Google Gemini Multimodal.

---

## 🔬 7. Reconstrução de Papers & Consulta Científica

1. **Desbloqueio Legal via Unpaywall:** Detecção de DOI e consulta automática à API do Unpaywall para localizar e raspar preprints e versões abertas autorizadas (arXiv, PMC, universidades).
2. **Dossiê por Citações & Literatura:** Caso o artigo esteja protegido por paywall rígido ou firewalls Cloudflare/anti-bot, o motor sintetiza o conhecimento acadêmico indexado gerando uma reconstrução estruturada da tese, metodologia, métricas e consenso científico.

---

## 📋 8. Modos de Cópia e Otimização para LLMs

A plataforma oferece 3 modalidades claras de cópia, acompanhadas de guia explicativo na interface:
1. **Copiar Puro:** Copia o Markdown ou JSON exatamente como extraído, sem prompts artificiais. Para notas (Obsidian, Notion) e código.
2. **Copiar p/ LLM (Resumido):** Condensa o documento em ~2.100 tokens (~8.500 caracteres) mantendo a estrutura inicial e conclusões, já acompanhado de prompt de pergunta. Ideal para **ChatGPT Free, Claude Free, DeepSeek e Cursor**.
3. **Copiar p/ LLM (Completo):** Mantém 100% da integridade do texto original com prompt de contextualização pronto para modelos de contexto amplo (**GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro**).

---

## 💬 9. Chat Contextual RAG

1. **Fundamentação Estrita:** Respostas da IA devem ser baseadas unicamente no conteúdo extraído do documento para mitigar alucinações.
2. **Cascata de Modelos:** Alternância inteligente entre `gemini-3.6-flash`, `gemini-3.1-flash-lite-preview` e `gemini-3.5-flash`.
3. **Ações Rápidas:** Atalhos de um clique para Resumo Executivo, Conclusões Principais, Tradução e FAQ.

---

## 🛠️ 10. Stack & Convenções Técnicas

- **Frontend:** Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS 4, Radix UI / Shadcn.
- **Backend:** NestJS 11 LTS (CommonJS para compatibilidade serverless com Vercel), Express body parser ajustado para 50MB.
- **Deploy:** Monorepo Vercel Serverless.
