'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Download, Check, FileText, FileJson, Info, MessageSquare, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getJob, type ScrapeJob } from '@/lib/api';
import { MarkdownViewer } from '@/components/markdown-viewer';
import { JsonTreeViewer } from '@/components/json-tree-viewer';
import { ChatPanel } from '@/components/chat-panel';

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLlmCompact, setCopiedLlmCompact] = useState(false);
  const [copiedLlmFull, setCopiedLlmFull] = useState(false);
  const [showCopyGuide, setShowCopyGuide] = useState(false);

  useEffect(() => {
    getJob(id)
      .then(setJob)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const condenseContentForLlm = (text: string, maxLength: number = 8000): string => {
    if (!text) return '';

    // 1. Strip image tags: ![alt](url) -> ""
    let cleaned = text.replace(/!\[.*?\]\(.*?\)/g, '');
    // 2. Simplify links: [title](url) -> title
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // 3. Remove excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    // 4. Clean base64 data URIs
    cleaned = cleaned.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, '[dados incorporados]');

    if (cleaned.length <= maxLength) return cleaned;

    // 5. Intelligent excerpt: beginning (title, intro, headers) + end (conclusions, data)
    const headSize = Math.floor(maxLength * 0.65);
    const tailSize = Math.floor(maxLength * 0.3);
    const head = cleaned.substring(0, headSize).trim();
    const tail = cleaned.substring(cleaned.length - tailSize).trim();

    return `${head}\n\n[... trecho intermediário condensado para limite do chat ...]\n\n${tail}`;
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLlm = async (text: string, jobUrl: string, mode: 'compact' | 'full' = 'compact') => {
    if (mode === 'compact') {
      const condensed = condenseContentForLlm(text, 8500);
      const formatted = `Documento / Fonte: ${jobUrl}\n\n--- INÍCIO DO CONTEÚDO (SINTETIZADO P/ CHAT) ---\n${condensed}\n--- FIM DO CONTEÚDO ---\n\nInstrução: Com base nas informações acima, responda de forma objetiva:`;
      await navigator.clipboard.writeText(formatted);
      setCopiedLlmCompact(true);
      setTimeout(() => setCopiedLlmCompact(false), 2000);
    } else {
      const formatted = `Documento / Fonte: ${jobUrl}\n\n=== CONTEÚDO EXTRAÍDO COMPLETO ===\n${text}\n=== FIM DO CONTEÚDO ===\n\nInstrução: Com base nas informações acima, por favor responda:`;
      await navigator.clipboard.writeText(formatted);
      setCopiedLlmFull(true);
      setTimeout(() => setCopiedLlmFull(false), 2000);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!job) return null;

  const content = job.contentMd || (job.contentJson ? JSON.stringify(job.contentJson, null, 2) : '') || '';
  const hostname = (() => { try { return new URL(job.url).hostname; } catch { return job.url; } })();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold truncate max-w-md" title={job.url}>
              {hostname}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={job.status === 'COMPLETED' ? 'default' : job.status === 'FAILED' ? 'destructive' : 'secondary'}>
                {job.status}
              </Badge>
              <Badge variant="outline">
                {job.metadata?.isReconstructed
                  ? '🔍 Reconstrução Científica'
                  : job.metadata?.isLegalOpenAccess
                  ? '🔓 Open Access'
                  : job.mode === 'UPLOAD'
                  ? '📎 Arquivo / Print'
                  : job.mode}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleString('pt-BR')}
              </span>
              {content && (
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="text-emerald-400 font-medium">
                    • ~{Math.ceil(content.length / 4).toLocaleString()} tokens
                  </span>
                  {content.length > 8500 && (
                    <span className="text-muted-foreground text-[11px]">
                      (Resumo p/ chat: ~2.100 tokens)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCopyGuide(!showCopyGuide)}
            className="text-xs text-muted-foreground hover:text-primary gap-1 cursor-pointer"
            title="Como escolher o botão de cópia ideal?"
          >
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Ajuda de Cópia</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(content)}
            title="Copiar Markdown ou JSON original puro, sem cabeçalhos ou prompts"
          >
            {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-400" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar Puro'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyLlm(content, job.url, 'compact')}
            title="Copiar com prompt resumido (~2.100 tokens) - ideal para ChatGPT Free, Claude Free e DeepSeek"
            className="border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium gap-1.5"
          >
            {copiedLlmCompact ? <Check className="h-4 w-4 text-emerald-400" /> : <Sparkles className="h-4 w-4 text-primary" />}
            <span>{copiedLlmCompact ? 'Copiado Resumido!' : 'Copiar p/ LLM (Resumido)'}</span>
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.2 rounded font-mono font-normal">~2k tok</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyLlm(content, job.url, 'full')}
            title="Copiar 100% do documento na íntegra com prompt de sistema pronto para modelos de contexto amplo (GPT-4o, Claude Sonnet, Gemini Pro)"
            className="gap-1.5"
          >
            {copiedLlmFull ? <Check className="h-4 w-4 text-emerald-400" /> : <Sparkles className="h-4 w-4 opacity-50" />}
            <span>{copiedLlmFull ? 'Copiado Completo!' : 'Copiar p/ LLM (Completo)'}</span>
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded font-mono font-normal">100%</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleDownload(
                content,
                `${hostname}-${job.id.slice(0, 8)}.${job.contentMd ? 'md' : 'json'}`,
              )
            }
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              }
            />
            <SheetContent className="w-[400px] sm:w-[540px] p-0 h-full max-h-screen overflow-hidden flex flex-col">
              <ChatPanel jobId={job.id} content={content} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Guia Explicativo dos Botões de Cópia */}
      {showCopyGuide && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs space-y-3 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Guia de Cópia: Qual formato escolher e como usar?</span>
            </div>
            <button
              onClick={() => setShowCopyGuide(false)}
              className="text-muted-foreground hover:text-foreground text-xs cursor-pointer px-2 py-0.5 rounded hover:bg-muted"
            >
              ✕ Fechar guia
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-background/90 rounded-lg p-3 border border-border/60 space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>1. Copiar Puro</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong>O que faz:</strong> Copia o Markdown ou JSON exatamente como extraído, sem prompts artificiais.<br />
                <strong>Quando usar:</strong> Para salvar em arquivos locais, notas (Obsidian, Notion), VS Code ou integrar em APIs.
              </p>
            </div>
            <div className="bg-background/90 rounded-lg p-3 border border-primary/30 space-y-1.5">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>2. Copiar p/ LLM (Resumido)</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong>O que faz:</strong> Sintetiza o texto em ~2.100 tokens mantendo o início estruturante e conclusões, já com prompt de pergunta.<br />
                <strong>Quando usar:</strong> Ideal para <strong>ChatGPT Free, Claude Free, DeepSeek e Cursor</strong> sem estourar limites de contexto.
              </p>
            </div>
            <div className="bg-background/90 rounded-lg p-3 border border-border/60 space-y-1.5">
              <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>3. Copiar p/ LLM (Completo)</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong>O que faz:</strong> Preserva 100% do texto original com prompt de sistema pronto para contextualização de IA.<br />
                <strong>Quando usar:</strong> Recomendado para modelos com janelas amplas (<strong>GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro</strong>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Special Information Banners */}
      {job.metadata?.isReconstructed && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-300 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-purple-200 text-sm">
              Síntese Científica Reconstruída por Literatura & Citações
            </p>
            <p className="text-muted-foreground leading-relaxed">
              O conteúdo abaixo foi sintetizado com base no consenso de artigos que citam esta pesquisa, preprints abertos e metadados bibliográficos indexados (conforme os princípios de Uso Justo acadêmico), superando paywalls comerciais de forma 100% legal.
            </p>
          </div>
        </div>
      )}

      {job.metadata?.isLegalOpenAccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-start gap-3">
          <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-200 text-sm">
              Preprint Aberto Autorizado (Resgatado via Unpaywall)
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Uma versão aberta autorizada pelos autores foi encontrada e extraída com sucesso de:{' '}
              <a
                href={job.metadata.unpaywallUrl}
                target="_blank"
                rel="noreferrer"
                className="underline font-mono text-emerald-400 hover:text-emerald-300 break-all"
              >
                {job.metadata.unpaywallUrl}
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Error display */}
      {job.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {job.error}
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue={job.mode === 'EXTRACT' ? 'json' : 'markdown'} className="w-full">
        <TabsList>
          <TabsTrigger value="markdown" className="gap-2">
            <FileText className="h-4 w-4" />
            Markdown
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-2">
            <FileJson className="h-4 w-4" />
            JSON
          </TabsTrigger>
          <TabsTrigger value="metadata" className="gap-2">
            <Info className="h-4 w-4" />
            Metadados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markdown" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {job.contentMd ? (
                <MarkdownViewer content={job.contentMd} />
              ) : (
                <p className="text-muted-foreground italic">Sem conteúdo Markdown disponível</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {job.contentJson ? (
                <JsonTreeViewer data={job.contentJson} />
              ) : job.contentMd ? (
                <JsonTreeViewer data={{ content: job.contentMd, metadata: job.metadata }} />
              ) : (
                <p className="text-muted-foreground italic">Sem conteúdo JSON disponível</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações da Extração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">URL:</span>
                  <p className="font-mono text-xs break-all mt-1">{job.url}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Modo:</span>
                  <p className="mt-1">{job.mode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="mt-1">{job.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Formato:</span>
                  <p className="mt-1">{job.format}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tamanho:</span>
                  <p className="mt-1">{content ? `${(new TextEncoder().encode(content).length / 1024).toFixed(1)} KB` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tokens estimados:</span>
                  <p className="mt-1">~{content ? Math.ceil(content.length / 4).toLocaleString() : 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Criado em:</span>
                  <p className="mt-1">{new Date(job.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              {job.metadata && (
                <div className="mt-4">
                  <span className="text-muted-foreground text-sm">Metadata raw:</span>
                  <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-auto max-h-60">
                    {JSON.stringify(job.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
