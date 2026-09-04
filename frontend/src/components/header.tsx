import Link from 'next/link';
import { Zap, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Zap className="h-5 w-5 text-primary" />
          <span>SynapWeb</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/history" className="inline-flex items-center gap-2 rounded-lg px-2.5 h-7 text-sm font-medium hover:bg-muted hover:text-foreground transition-all">
            <History className="h-4 w-4" />
            Histórico
          </Link>
        </nav>
      </div>
    </header>
  );
}
