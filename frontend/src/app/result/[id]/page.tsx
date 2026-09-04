'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Download, Check, FileText, FileJson, Info, MessageSquare } from 'lucide-react';
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

  useEffect(() => {
    getJob(id)
      .then(setJob)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const content = job.contentMd || JSON.stringify(job.contentJson, null, 2) || '';
  const hostname = (() => { try { return new URL(job.url).hostname; } catch { return job.url; } })();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold truncate max-w-md" title={job.url}>
              {hostname}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={job.status === 'COMPLETED' ? 'default' : job.status === 'FAILED' ? 'destructive' : 'secondary'}>
                {job.status}
              </Badge>
              <Badge variant="outline">{job.mode}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(content)}
          >
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
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
            <Download className="mr-2 h-4 w-4" />
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
            <SheetContent className="w-[400px] sm:w-[540px] p-0">
              <ChatPanel jobId={job.id} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Error display */}
      {job.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {job.error}
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="markdown" className="w-full">
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
