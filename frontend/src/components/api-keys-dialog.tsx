'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Check, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getStoredApiKeys, saveStoredApiKeys, clearStoredApiKeys } from '@/lib/storage';

export function ApiKeysDialog() {
  const [open, setOpen] = useState(false);
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showFirecrawl, setShowFirecrawl] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasCustomKeys, setHasCustomKeys] = useState(false);

  useEffect(() => {
    const keys = getStoredApiKeys();
    setFirecrawlKey(keys.firecrawlKey || '');
    setGeminiKey(keys.geminiKey || '');
    setHasCustomKeys(Boolean(keys.firecrawlKey?.trim() || keys.geminiKey?.trim()));
  }, [open]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredApiKeys({
      firecrawlKey: firecrawlKey.trim(),
      geminiKey: geminiKey.trim(),
    });
    setHasCustomKeys(Boolean(firecrawlKey.trim() || geminiKey.trim()));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1200);
  };

  const handleClear = () => {
    clearStoredApiKeys();
    setFirecrawlKey('');
    setGeminiKey('');
    setHasCustomKeys(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="relative gap-2">
            <Key className="h-4 w-4 text-primary" />
            <span>Chaves de API</span>
            {hasCustomKeys && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <DialogTitle>Minhas Chaves de API (BYOK)</DialogTitle>
          </div>
          <DialogDescription>
            Conecte suas próprias chaves gratuitas para usar a ferramenta sem limites e sem depender dos créditos do servidor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Firecrawl Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                Chave Firecrawl (Scraping & Crawl)
                {firecrawlKey.trim() && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-emerald-500/10 text-emerald-400">
                    Ativa
                  </Badge>
                )}
              </label>
              <a
                href="https://www.firecrawl.dev"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Criar grátis
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                type={showFirecrawl ? 'text' : 'password'}
                placeholder="fc-..."
                value={firecrawlKey}
                onChange={(e) => setFirecrawlKey(e.target.value)}
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowFirecrawl(!showFirecrawl)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showFirecrawl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Usada para extrair Markdown, varrer sites e extrair JSON.
            </p>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                Chave Google Gemini (Chat & IA)
                {geminiKey.trim() && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-emerald-500/10 text-emerald-400">
                    Ativa
                  </Badge>
                )}
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Criar grátis (Google AI Studio)
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                type={showGemini ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Usada para conversar com os documentos raspados e fallback de extração.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground flex gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">100% Seguro e Privado:</strong> Suas chaves ficam salvas apenas no LocalStorage do seu navegador. Elas nunca são salvas em bancos de dados do servidor.
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2">
            {hasCustomKeys && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remover chaves
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button type="submit" size="sm">
                {saved ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4 text-emerald-400" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Salvar Chaves
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
