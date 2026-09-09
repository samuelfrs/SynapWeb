'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { sendChatMessage, getChatMessages, type ChatMessage } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatPanelProps {
  jobId: string;
  content?: string;
}

const quickPrompts = [
  { icon: '⚡', label: 'Resumo em tópicos', text: 'Faça um resumo executivo deste documento em 5 tópicos claros e objetivos.' },
  { icon: '🔍', label: 'Conclusões e dados', text: 'Quais são as principais conclusões, métricas e resultados apresentados?' },
  { icon: '🇧🇷', label: 'Traduzir resumo', text: 'Traduza os pontos principais deste documento para o português de forma fluida.' },
  { icon: '❓', label: 'FAQ do documento', text: 'Gere um FAQ com as 4 perguntas e respostas mais importantes que este documento responde.' },
];

export function ChatPanel({ jobId, content }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatMessages(jobId)
      .then(setMessages)
      .catch(() => {});
  }, [jobId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setLoading(true);

    // Optimistic UI: add user message immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      jobId,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      // Safe content truncation to prevent huge network overhead (first 35,000 chars is plenty for RAG context)
      const safeContent = content ? content.substring(0, 35000) : undefined;
      const assistantMessage = await sendChatMessage(jobId, userMessage, safeContent, history);
      // Replace temp message and add assistant response
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [
          ...withoutTemp,
          { ...tempUserMsg, id: `user-${Date.now()}` },
          assistantMessage,
        ];
      });
    } catch (err: any) {
      const errorDetail = err?.message || 'Falha de comunicação com o servidor.';
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [
          ...withoutTemp,
          {
            id: `error-${Date.now()}`,
            jobId,
            role: 'assistant',
            content: `⚠️ **Não foi possível obter resposta:**\n\n${errorDetail}\n\n*Dica: Verifique se o servidor backend está rodando e se sua chave Gemini está configurada em "Chaves de API" no topo da página.*`,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    handleSendText(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] h-screen max-h-screen w-full overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Chat com o Documento
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Perguntas fundamentadas estritamente no conteúdo extraído
          </p>
        </div>
      </div>

      {/* Messages - guaranteed scroll area constrained by grid */}
      <div className="min-h-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4 py-8">
            <div className="text-center text-muted-foreground text-sm">
              <Bot className="h-9 w-9 mx-auto mb-2 opacity-50 text-primary" />
              <p className="font-medium text-foreground">Como posso ajudar com este documento?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Escolha uma pergunta rápida abaixo ou digite o que desejar:
              </p>
            </div>

            {/* Quick prompts grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSendText(p.text)}
                  className="flex flex-col items-start gap-1 p-3 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted hover:border-primary/40 text-left transition-all group"
                >
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {p.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <article className="prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </article>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background">
        {/* Chips row */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1 overflow-x-auto text-[11px] border-b border-border/30">
            <span className="text-muted-foreground shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Sugestões:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleSendText(p.text)}
                className="rounded-md border border-border/60 bg-muted/40 hover:bg-muted px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 flex gap-2">
          <Textarea
            placeholder="Pergunte sobre o documento..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="resize-none text-sm"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
