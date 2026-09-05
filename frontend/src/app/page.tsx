'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, FolderSearch, FileJson, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { HowToUseDialog } from '@/components/how-to-use-dialog';
import { scrapeUrl, crawlDomain, extractJson } from '@/lib/api';

type Mode = 'SCRAPE' | 'CRAWL' | 'EXTRACT';

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
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<Mode>('SCRAPE');
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <div className="space-y-4 text-center pt-8">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">SynapWeb</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Converta qualquer site, documentação ou PDF em conteúdo limpo para LLMs
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
                disabled={loading}
              />
              <Button type="submit" size="lg" disabled={loading || !url.trim()} className="h-12 px-8">
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
                disabled={loading}
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
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
