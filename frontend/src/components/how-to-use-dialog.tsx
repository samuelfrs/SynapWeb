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
    badge: 'Uso Ilimitado',
    icon: Key,
    headline: 'Conecte suas chaves gratuitas do Firecrawl e Gemini',
    description:
      'Para utilizar a aplicação de forma ilimitada sem depender dos créditos do servidor, você pode cadastrar suas chaves gratuitas de API.',
    details: [
      {
        title: 'Chave Firecrawl (Scraping & Crawling):',
        text: 'Crie uma conta gratuita em firecrawl.dev para receber créditos de extração de páginas e PDFs.',
        link: 'https://www.firecrawl.dev',
        linkText: 'Criar no Firecrawl.dev',
      },
      {
        title: 'Chave Google Gemini (Chat & IA):',
        text: 'Gere uma chave 100% gratuita no Google AI Studio para usar os modelos Gemini no chat e extrações.',
        link: 'https://aistudio.google.com/app/apikey',
        linkText: 'Criar no Google AI Studio',
      },
    ],
    tip: '🔒 Suas chaves ficam guardadas apenas no LocalStorage do seu navegador. Elas nunca são salvas no banco de dados do servidor.',
  },
  {
    id: 2,
    title: '2. Escolha o Modo de Extração',
    badge: '3 Modos Poderosos',
    icon: Globe,
    headline: 'Converta qualquer conteúdo da web para Markdown ou JSON',
    description:
      'Cole a URL de qualquer site, documentação ou PDF no campo de busca e escolha o modo desejado:',
    details: [
      {
        title: '🌐 Scrape URL (Mais comum):',
        text: 'Extrai uma única página, post de blog, artigo científico ou arquivo PDF direto em Markdown limpo, removendo cabeçalhos, menus e anúncios.',
      },
      {
        title: '📁 Crawl Docs:',
        text: 'Varre uma documentação inteira recursivamente (até 10 páginas) e consolida todo o conteúdo em um documento único pronto para RAG.',
      },
      {
        title: '🏷️ Extrair JSON:',
        text: 'Extrai dados estruturados com IA. Você pode escrever em português o que quer extrair (ex: "Extraia título, resumo, tópicos e preços").',
      },
    ],
    tip: '💡 Dica: URLs de PDFs acadêmicos (como ACM Digital Library e arXiv) são normalizadas automaticamente para extrair o artigo completo.',
  },
  {
    id: 3,
    title: '3. Visualize, Copie e Baixe',
    badge: 'Exportação Instantânea',
    icon: FileText,
    headline: 'Três visualizações para atender às suas necessidades',
    description:
      'Assim que a extração termina, você é direcionado para a tela de resultados com abas dedicadas:',
    details: [
      {
        title: 'Aba Markdown:',
        text: 'Alterne entre o Preview formatado (com suporte a tabelas, códigos e imagens) e o Código-Fonte puro.',
      },
      {
        title: 'Aba JSON:',
        text: 'Navegue por uma árvore interativa de nós expansíveis com sintaxe colorida dos dados estruturados.',
      },
      {
        title: 'Aba Metadados:',
        text: 'Confira status HTTP, contagem de tokens estimados, tamanho em KB e data da raspagem.',
      },
    ],
    tip: 'Use os botões "Copiar" ou "Download (.md / .json)" no topo direito para salvar no seu computador imediatamente.',
  },
  {
    id: 4,
    title: '4. Converse com o Documento (RAG)',
    badge: 'Gemini Integrado',
    icon: MessageSquare,
    headline: 'Tire dúvidas e faça perguntas com IA sobre o conteúdo',
    description:
      'No canto superior direito da página de resultado, clique no botão "Chat" para abrir o painel lateral:',
    details: [
      {
        title: 'Respostas 100% Fundamentadas:',
        text: 'A IA utiliza exclusivamente o documento extraído como fonte de conhecimento, evitando alucinações.',
      },
      {
        title: 'Painel com Rolagem Travada:',
        text: 'O campo de digitação fica permanentemente visível no rodapé, permitindo enviar mensagens livremente sem perder a posição.',
      },
      {
        title: 'Fallback Automático:',
        text: 'Se o modelo Gemini enfrentar alta demanda temporária, o sistema alterna silenciosamente para modelos de backup para nunca deixar você sem resposta.',
      },
    ],
    tip: 'Exemplo de pergunta: "Faça um resumo dos 3 pontos principais deste artigo em bullet points."',
  },
  {
    id: 5,
    title: '5. Histórico e Privacidade',
    badge: 'Local-First',
    icon: ShieldCheck,
    headline: 'Seus dados permanecem seguros no seu próprio computador',
    description:
      'O SynapWeb adota uma arquitetura Local-First para garantir a máxima privacidade:',
    details: [
      {
        title: 'Tudo no LocalStorage:',
        text: 'Seus scrapes e conversas são armazenados no seu navegador. Nenhum servidor guarda histórico do que você pesquisou.',
      },
      {
        title: 'Página de Histórico:',
        text: 'Acesse o menu "Histórico" a qualquer momento para revisitar suas extrações, abrir chats anteriores ou apagar itens.',
      },
      {
        title: 'Gerenciamento de Espaço:',
        text: 'O sistema mantém automaticamente as 50 extrações mais recentes para não sobrecarregar a memória do navegador.',
      },
    ],
    tip: 'Você tem controle total: apague extrações individuais ou use o botão "Limpar tudo" quando desejar.',
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
                Guia rápido em 5 passos para extrair conteúdos da web e conversar com IA
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
