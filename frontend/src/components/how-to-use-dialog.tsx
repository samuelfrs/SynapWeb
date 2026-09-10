'use client';

import { useState } from 'react';
import {
  HelpCircle,
  Key,
  Globe,
  FolderSearch,
  FileJson,
  FileText,
  Download,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  FileUp,
  Copy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HowToUseDialogProps {
  trigger?: React.ReactNode;
}

interface StepDetail {
  title: string;
  text: string;
  link?: string;
  linkText?: string;
}

interface Step {
  id: number;
  title: string;
  badge: string;
  icon: any;
  headline: string;
  description: string;
  details: StepDetail[];
  tip: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: '1. Chaves de API (BYOK)',
    badge: 'Uso Ilimitado & Grátis',
    icon: Key,
    headline: 'Conecte suas chaves gratuitas do Firecrawl e Gemini',
    description:
      'Para utilizar a aplicação de forma ilimitada sem depender de créditos do servidor, você pode cadastrar suas chaves gratuitas de API no botão "Chaves de API" no topo da página:',
    details: [
      {
        title: 'Chave Firecrawl (Scraping & Crawling):',
        text: 'Crie uma conta gratuita em firecrawl.dev para receber créditos mensais para raspagem de páginas e PDFs.',
        link: 'https://www.firecrawl.dev',
        linkText: 'Criar no Firecrawl.dev',
      },
      {
        title: 'Chave Google Gemini (Chat, IA & Multimodal):',
        text: 'Gere uma chave 100% gratuita no Google AI Studio para usar os modelos Gemini no chat, extrações e visão multimodal.',
        link: 'https://aistudio.google.com/app/apikey',
        linkText: 'Criar no Google AI Studio',
      },
    ],
    tip: '🔒 Suas chaves ficam salvas estritamente no LocalStorage do seu navegador. Elas nunca são gravadas no banco de dados do servidor.',
  },
  {
    id: 2,
    title: '2. Extração Web & Docs',
    badge: 'Scrape, Crawl & JSON',
    icon: Globe,
    headline: 'Converta qualquer conteúdo da web para Markdown limpo ou JSON',
    description:
      'Cole a URL de qualquer site, documentação ou PDF no campo de busca e escolha o modo ideal:',
    details: [
      {
        title: '🌐 Scrape URL (Cirúrgico):',
        text: 'Extrai uma única página, post ou PDF direto em Markdown limpo. O motor higieniza o conteúdo removendo anúncios, banners, imagens publicitárias, menus, avisos de cookies e rodapés.',
      },
      {
        title: '📁 Crawl Docs (10 págs e Max):',
        text: 'Varre documentações inteiras recursivamente em lote. Escolha "10 págs" para consultas rápidas ou "Max" para raspar o máximo de páginas viáveis dentro do tempo limite com resgate de páginas parciais.',
      },
      {
        title: '🏷️ Extrair JSON com IA:',
        text: 'Extrai dados estruturados escrevendo em linguagem natural o que deseja capturar (ex: "Extraia título, resumo, metodologia e métricas"). Opera com Firecrawl v2 e fallback Gemini.',
      },
    ],
    tip: '💡 A higienização automática preserva a formatação original e blocos de código intactos enquanto elimina elementos espúrios e poluição visual.',
  },
  {
    id: 3,
    title: '3. Papers & Meio Científico',
    badge: 'Pesquisa Acadêmica',
    icon: Sparkles,
    headline: 'Desbloqueio de artigos, preprints abertos e síntese por citações',
    description:
      'Desenvolvido para pesquisadores, pós-graduandos e cientistas de dados superarem paywalls acadêmicos comerciais de forma legítima:',
    details: [
      {
        title: '🔓 Desbloqueio Legal via Unpaywall:',
        text: 'Cole a URL da publicação (ACM, IEEE, Nature, Springer, etc.) ou o DOI (ex: 10.1145/3065386). O sistema consulta o Unpaywall e recupera preprints e versões abertas autorizadas pelos próprios autores.',
      },
      {
        title: '🔬 Dossiê de Reconstrução por Literatura & Citações:',
        text: 'Caso o artigo esteja fechado por paywall rígido ou bloqueio de bot, a IA mapeia artigos indexados e citações dos pares para reconstruir tese, metodologia, métricas e consenso científico.',
      },
      {
        title: '⚡ Sugestão Automática de Resgate:',
        text: 'Se uma extração tradicional sofrer bloqueio anti-bot em link acadêmico, a tela sugere um botão de 1 clique para ativar a Reconstrução Científica.',
      },
    ],
    tip: '🎓 100% legal e fundamentado no Uso Justo (Fair Use) para revisão sistemática da literatura.',
  },
  {
    id: 4,
    title: '4. Arquivos & Print (Ctrl+V)',
    badge: 'Multimodal (até 50MB)',
    icon: FileUp,
    headline: 'Suba PDFs locais, códigos ou cole prints da tela instantaneamente',
    description:
      'Alterne para a aba "Anexar / Print (Ctrl+V)" para processar dados locais ou visuais com o Gemini Multimodal:',
    details: [
      {
        title: '📎 Drag & Drop e Seletor:',
        text: 'Suporte a arquivos PDF, imagens (PNG, JPG, WebP), planilhas CSV, JSON, TXT e código-fonte (TypeScript, Python, HTML, etc.).',
      },
      {
        title: '📋 Colagem Direta com Ctrl+V (Clipboard):',
        text: 'Aperte Ctrl+V em qualquer lugar da tela para colar uma captura de tela (print) da área de transferência e extrair tabelas, diagramas e textos de imagens.',
      },
      {
        title: '🚀 Suporte a Arquivos de até 50MB:',
        text: 'Envie documentos volumosos processados de ponta a ponta pelo modelo multimodal.',
      },
    ],
    tip: '💡 Dica: Cole um print de um gráfico ou diagrama e utilize o Chat RAG para explicar os dados.',
  },
  {
    id: 5,
    title: '5. Modos de Cópia & LLMs',
    badge: 'Exportação Otimizada',
    icon: FileText,
    headline: 'Formatos especializados para cada modelo de inteligência artificial',
    description:
      'Na página de resultados, utilize as três opções de cópia projetadas para fluxos de IA:',
    details: [
      {
        title: '📋 1. Copiar Puro:',
        text: 'Copia o Markdown ou JSON exatamente como extraído, sem prompts artificiais. Ideal para salvar em notas (Obsidian, Notion), VS Code ou integrar em APIs.',
      },
      {
        title: '⚡ 2. Copiar p/ LLM (Resumido):',
        text: 'Condensa o documento para ~2.100 tokens mantendo o início estruturante e conclusões, acompanhado de prompt de pergunta. Ideal para ChatGPT Free, Claude Free, DeepSeek e Cursor sem estourar limites.',
      },
      {
        title: '📜 3. Copiar p/ LLM (Completo):',
        text: 'Preserva 100% do texto original na íntegra com prompt de contextualização pronto. Recomendado para modelos de contexto amplo (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro).',
      },
      {
        title: '💾 Download Direto:',
        text: 'Baixe o documento bruto em arquivo .md ou .json no seu computador com um clique.',
      },
    ],
    tip: '💡 Clique em "Ajuda de Cópia" na barra de ações do resultado para consultar detalhes de cada formato.',
  },
  {
    id: 6,
    title: '6. Chat RAG & Backup Local',
    badge: 'Local-First & Privacidade',
    icon: MessageSquare,
    headline: 'Sabatinar o documento com IA e gerenciar seu histórico soberano',
    description:
      'Converse com os dados extraídos mantendo controle total sobre a sua privacidade:',
    details: [
      {
        title: '💬 Chat RAG Fundamentado:',
        text: 'Respostas baseadas estritamente no documento extraído para evitar alucinações, com memória de conversação e fallback automático entre modelos Gemini.',
      },
      {
        title: '⚡ Ações Rápidas de 1 Clique:',
        text: 'Atalhos no painel do chat para gerar Resumo Executivo, Conclusões Principais, Tradução ou FAQ completo em segundos.',
      },
      {
        title: '🔒 Arquitetura Local-First (Zero Database):',
        text: 'Nenhum histórico é gravado no servidor. Tudo fica salvo no LocalStorage do seu próprio navegador.',
      },
      {
        title: '📦 Backup e Portabilidade:',
        text: 'Na página de Histórico, use "Exportar Backup (JSON)" para salvar seus dados e "Importar Histórico" para migrar para outro navegador ou dispositivo.',
      },
    ],
    tip: 'Você tem controle total: delete extrações individuais ou limpe todo o histórico quando desejar.',
  },
];

export function HowToUseDialog({ trigger }: HowToUseDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const currentStep = steps.find((s) => s.id === activeStep) || steps[0];
  const StepIcon = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as any)
          ) : (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Como Usar</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Como Usar o SynapWeb</DialogTitle>
              <DialogDescription className="text-xs">
                Guia prático em 6 passos para dominar extração web, reconstrução de papers e fluxos para LLMs
              </DialogDescription>
            </div>
          </div>

          {/* Stepper buttons */}
          <div className="flex items-center justify-between gap-1 pt-3 overflow-x-auto">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === activeStep;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>Passo {s.id}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Step Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {currentStep.badge}
                </Badge>
                <h3 className="font-semibold text-base text-foreground">{currentStep.headline}</h3>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{currentStep.description}</p>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-4">
            {currentStep.details.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-5 leading-relaxed">{item.text}</p>
                {item.link && (
                  <div className="pl-5 pt-0.5">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      {item.linkText}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            {currentStep.tip}
          </div>
        </div>

        {/* Footer controls */}
        <DialogFooter className="p-4 border-t border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            className="text-xs gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Anterior
          </Button>

          <span className="text-xs text-muted-foreground font-mono">
            {activeStep} de {steps.length}
          </span>

          {activeStep < steps.length ? (
            <Button
              size="sm"
              onClick={() => setActiveStep((prev) => Math.min(steps.length, prev + 1))}
              className="text-xs gap-1"
            >
              Próximo
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setOpen(false)} className="text-xs gap-1">
              Começar a Usar
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
