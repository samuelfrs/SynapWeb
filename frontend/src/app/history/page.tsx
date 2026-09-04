'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, FolderSearch, FileJson, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getJobs, type ScrapeJob } from '@/lib/api';

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

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Histórico de Extrações</h1>
        <Button variant="outline" size="sm" onClick={loadJobs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Carregando...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Nenhuma extração encontrada</p>
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
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium truncate max-w-md" title={job.url}>
                          {hostname}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                          {job.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusColors[job.status]}>{job.status}</Badge>
                      <Badge variant="outline">{job.mode}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString('pt-BR')}
                      </span>
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
