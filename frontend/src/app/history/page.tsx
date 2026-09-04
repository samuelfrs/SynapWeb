'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, FolderSearch, FileJson, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getJobs, type ScrapeJob } from '@/lib/api';
import { deleteLocalJob, clearLocalJobs } from '@/lib/storage';

const modeIcons = {
  SCRAPE: Globe,
  CRAWL: FolderSearch,
  EXTRACT: FileJson,
};

const statusColors = {
  COMPLETED: 'default' as const,
  FAILED: 'destructive' as const,
  PROCESSING: 'secondary' as const,
  PENDING: 'outline' as const,
};

export default function HistoryPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = () => {
    setLoading(true);
    getJobs()
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteLocalJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico local?')) {
      clearLocalJobs();
      setJobs([]);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Extrações</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Salvo localmente no seu navegador (privado e sem limites de servidor)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {jobs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-1.5 h-4 w-4" />
              Limpar tudo
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadJobs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Carregando...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Nenhuma extração encontrada no seu histórico local</p>
          <Button className="mt-4" render={<Link href="/" />}>
            Fazer primeira extração
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const Icon = modeIcons[job.mode];
            const hostname = (() => { try { return new URL(job.url).hostname; } catch { return job.url; } })();
            return (
              <Link key={job.id} href={`/result/${job.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="font-medium truncate" title={job.url}>
                          {hostname}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {job.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={statusColors[job.status]}>{job.status}</Badge>
                      <Badge variant="outline">{job.mode}</Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(job.createdAt).toLocaleString('pt-BR')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, job.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive h-8 w-8"
                        title="Remover do histórico"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
