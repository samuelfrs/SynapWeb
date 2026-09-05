'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Image as ImageIcon, File, X, Loader2, Sparkles, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { uploadFile } from '@/lib/api';

interface FileDropzoneProps {
  onSuccess?: (jobId: string) => void;
}

export function FileDropzone({ onSuccess }: FileDropzoneProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Global Ctrl+V listener for image pasting
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);
    if (file.size > 25 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 25 MB.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const isTextFile =
        selectedFile.type.startsWith('text/') ||
        selectedFile.name.endsWith('.txt') ||
        selectedFile.name.endsWith('.md') ||
        selectedFile.name.endsWith('.csv') ||
        selectedFile.name.endsWith('.json');

      if (isTextFile) {
        // Read text directly
        const textContent = await selectedFile.text();
        const job = await uploadFile({
          filename: selectedFile.name,
          mimeType: selectedFile.type || 'text/plain',
          textContent,
          prompt: customPrompt || undefined,
        });

        if (onSuccess) onSuccess(job.id);
        else router.push(`/result/${job.id}`);
      } else {
        // Read as base64 for PDF and Images (processed via Gemini Multimodal)
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];

            const job = await uploadFile({
              filename: selectedFile.name,
              mimeType: selectedFile.type || 'application/pdf',
              base64,
              prompt: customPrompt || undefined,
            });

            if (onSuccess) onSuccess(job.id);
            else router.push(`/result/${job.id}`);
          } catch (err: any) {
            setError(err.message || 'Erro ao processar arquivo.');
            setLoading(false);
          }
        };
        reader.readAsDataURL(selectedFile);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo.');
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return UploadCloud;
    if (selectedFile.type.startsWith('image/')) return ImageIcon;
    if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) return FileText;
    return File;
  };

  const Icon = getFileIcon();

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[0.99]'
              : 'border-border hover:border-primary/50 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <p className="font-medium text-sm">
                Arraste seu arquivo aqui ou <span className="text-primary underline underline-offset-4">procure no computador</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Suporta PDFs, imagens (.png, .jpg, .webp) e documentos (.txt, .md, .csv) até 25 MB
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40 mt-1">
              <Clipboard className="h-3.5 w-3.5 text-primary" />
              <span>Dica: você também pode <strong>tirar um print</strong> e apertar <strong>Ctrl+V</strong></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-12 w-12 rounded object-cover border border-border shrink-0"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
              )}
              <div className="truncate">
                <p className="text-sm font-medium truncate max-w-sm" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Documento'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={clearFile}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            placeholder="Instrução opcional para a IA (ex: 'Extraia as tabelas financeiras em markdown', 'Transcreva com foco nos gráficos')..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            className="text-xs resize-none"
            disabled={loading}
          />

          <Button
            onClick={handleProcess}
            disabled={loading}
            className="w-full h-11 text-sm font-medium gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando com Gemini Multimodal...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extrair e Processar Documento
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
