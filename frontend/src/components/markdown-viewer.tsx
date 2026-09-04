'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Eye, Code } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'preview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('preview')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button
          variant={viewMode === 'source' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('source')}
        >
          <Code className="mr-2 h-4 w-4" />
          Código Fonte
        </Button>
      </div>

      {viewMode === 'preview' ? (
        <article className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      ) : (
        <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto max-h-[600px] font-mono whitespace-pre-wrap">
          {content}
        </pre>
      )}
    </div>
  );
}
