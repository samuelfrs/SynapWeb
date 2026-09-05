'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  FolderSearch,
  FileJson,
  Loader2,
  Zap,
  UploadCloud,
  Sparkles,
  Search,
  FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { HowToUseDialog } from '@/components/how-to-use-dialog';
import { FileDropzone } from '@/components/file-dropzone';
import { scrapeUrl, crawlDomain, extractJson, reconstructPaper } from '@/lib/api';

type Mode = 'SCRAPE' | 'CRAWL' | 'EXTRACT';
type InputSource = 'URL' | 'FILE';

const modes = [
  {
    id: 'SCRAPE' as Mode,
    label: 'Scrape URL',
    description: 'Extraia o conteúdo de uma URL em Markdown limpo',
    icon: Globe,
  },
  {
    id: 'CRAWL' as Mode,
    label: 'Crawl Docs',
    description: 'Varra documentações inteiras recursivamente',
    icon: FolderSearch,
  },
  {
    id: 'EXTRACT' as Mode,
    label: 'Extrair JSON',
    description: 'Extraia dados estruturados com schema personalizado',
    icon: FileJson,
  },
];

export default function PlaygroundPage() {
  const router = useRouter();
  const [inputSource, setInputSource] = useState<InputSource>('URL');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<Mode>('SCRAPE');
  const [loading, setLoading] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractPrompt, setExtractPrompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let job;
      switch (mode) {
        case 'SCRAPE':
          job = await scrapeUrl(url);
          break;
        case 'CRAWL':
          job = await crawlDomain(url);
          break;
        case 'EXTRACT':
          job = await extractJson(url, extractPrompt || undefined);
          break;
      }
      router.push(`/result/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  const handleReconstruct = async () => {
    if (!url.trim()) return;
    setReconstructing(true);
    setError(null);
    try {
      const job = await reconstructPaper(url);
      router.push(`/result/${job.id}`);
    } catch (err: any) {
      setError(err.message || 'Falha ao reconstruir pesquisa.');
    } finally {
      setReconstructing(false);
    }
  };

  const isAntiBotError =
    error &&
    (error.toLowerCase().includes('bloque') ||
      error.toLowerCase().includes('firecrawl') ||
      error.toLowerCase().includes('anti-bot') ||
      error.toLowerCase().includes('cloudflare') ||
      error.toLowerCase().includes('engines failed'));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <div className="space-y-4 text-center pt-8">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">SynapWeb</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Converta qualquer site, documentação, PDF ou imagem em conteúdo limpo para LLMs
        </p>
        <div className="pt-1">
          <HowToUseDialog
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer shadow-xs"
              >
                <span>💡 Como usar em 5 passos</span>
                <span className="text-muted-foreground">→</span>
              </button>
            }
          />
        </div>
      </div>

      {/* Primary Input Mode Selector: URL vs File/Paste */}
      <div className="flex items-center justify-center p-1 bg-muted/40 border border-border/60 rounded-xl max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            setInputSource('URL');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            inputSource === 'URL'
              ? 'bg-background text-foreground shadow-xs border border-border/40'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>URL da Web</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setInputSource('FILE');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            inputSource === 'FILE'
              ? 'bg-background text-foreground shadow-xs border border-border/40'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileUp className="h-4 w-4" />
          <span>Anexar / Print (Ctrl+V)</span>
        </button>
      </div>

      {inputSource === 'FILE' ? (
        <Card>
          <CardContent className="pt-6">
            <FileDropzone />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-3">
            {modes.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all hover:border-primary/50 ${
                    mode === m.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.description}</span>
                </button>
              );
            })}
          </div>

          {/* URL Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://docs.example.com ou link para PDF..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 h-12 text-base"
                    required
                    disabled={loading || reconstructing}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading || reconstructing || !url.trim()}
                    className="h-12 px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Extrair
                      </>
                    )}
                  </Button>
                </div>

                {mode === 'EXTRACT' && (
                  <Textarea
                    placeholder='Descreva o que extrair, ex: "Extraia título, preço e descrição de cada produto"'
                    value={extractPrompt}
                    onChange={(e) => setExtractPrompt(e.target.value)}
                    rows={3}
                    disabled={loading || reconstructing}
                  />
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{mode}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {mode === 'SCRAPE' && 'Suporta sites, SPAs e links de PDF'}
                    {mode === 'CRAWL' && 'Varre subpáginas recursivamente (limite: 10 páginas)'}
                    {mode === 'EXTRACT' && 'Extrai dados em JSON com IA'}
                  </span>
                </div>

                {/* Quick try examples */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs flex-wrap">
                  <span className="text-muted-foreground shrink-0 font-medium">Testar com:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUrl('https://arxiv.org/abs/2312.11805');
                      setMode('SCRAPE');
                    }}
                    className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-[11px] cursor-pointer"
                  >
                    📄 Artigo ArXiv (Gemini)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrl('https://stripe.com/docs/api');
                      setMode('CRAWL');
                    }}
                    className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-[11px] cursor-pointer"
                  >
                    📚 Stripe API Docs
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrl('https://example.com');
                      setMode('EXTRACT');
                      setExtractPrompt('Extraia o título da página e a descrição principal em JSON');
                    }}
                    className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-[11px] cursor-pointer"
                  >
                    🏷️ Extrair JSON
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Anti-Bot / Paywall Rescue Card */}
            {isAntiBotError && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Bloqueado por Anti-bot ou Paywall? O SynapWeb pode resgatar</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O site bloqueou raspadores automáticos. O SynapWeb pode consultar o{' '}
                  <strong className="text-foreground">Unpaywall</strong> em busca de uma cópia aberta autorizada ou realizar uma{' '}
                  <strong className="text-foreground">Reconstrução Sintética por Citações & Consenso Científico</strong>.
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Button
                    type="button"
                    size="sm"
                    disabled={reconstructing}
                    onClick={handleReconstruct}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                  >
                    {reconstructing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Reconstruindo...
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" />
                        Reconstruir por Citações (Unpaywall + IA)
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInputSource('FILE')}
                    className="h-8 text-xs gap-1.5"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Ou Envie um Print (Ctrl+V)
                  </Button>
                </div>
              </div>
            )}

            {error && !isAntiBotError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
