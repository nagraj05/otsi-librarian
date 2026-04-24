'use client';

import { useState, useRef, useCallback } from 'react';
import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, BookOpen,
} from 'lucide-react';

interface Props {
  bookId: string;
  title: string;
  hasEbook: boolean;
}

type Status = 'idle' | 'uploading' | 'success' | 'error';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EbookUpload({ bookId, title, hasEbook }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setFile(null);
    setProgress(0);
    setStatus('idle');
    setErrorMsg('');
  }

  function handleClose(next: boolean) {
    if (status === 'uploading') return;
    setOpen(next);
    if (!next) reset();
  }

  function validateAndSet(f: File) {
    if (!f.name.toLowerCase().endsWith('.epub')) {
      toast.error('Only .epub files are accepted');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50 MB');
      return;
    }
    setFile(f);
    setStatus('idle');
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: `/api/books/${bookId}/ebook`,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      // Confirm in DB — needed in dev where Vercel webhook can't reach localhost
      const res = await fetch(`/api/books/${bookId}/ebook/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blob.url }),
      });
      if (!res.ok) throw new Error('Failed to save ebook URL');

      setStatus('success');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/books/${bookId}/ebook`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove ebook');
      toast.success('Ebook removed');
      router.refresh();
    } catch {
      toast.error('Failed to remove ebook');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      {/* Trigger area — shown on the catalog card */}
      <div className="flex items-center gap-1.5 mt-2">
        {hasEbook ? (
          <>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
              Ebook
            </span>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-0.5 disabled:opacity-50"
            >
              {removing
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Trash2 className="w-3 h-3" />}
            </button>
          </>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="text-[10px] font-semibold text-muted-foreground hover:text-brand transition-colors flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            Upload Ebook
          </button>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand" />
              Upload Ebook
            </DialogTitle>
            <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>
          </DialogHeader>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-success-muted flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success-muted-fg" />
              </div>
              <p className="font-semibold text-sm text-foreground">Ebook uploaded!</p>
              <p className="text-xs text-muted-foreground">The ebook is now available for readers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => status !== 'uploading' && inputRef.current?.click()}
                className={`
                  relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer
                  flex flex-col items-center justify-center gap-2 py-8 px-4 text-center
                  ${dragging
                    ? 'border-brand bg-brand/5'
                    : file
                    ? 'border-brand/40 bg-brand/5'
                    : 'border-border hover:border-brand/40 hover:bg-muted/50'}
                  ${status === 'uploading' ? 'pointer-events-none opacity-75' : ''}
                `}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".epub"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSet(f); }}
                />

                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-brand" />
                    <p className="font-semibold text-sm text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    {status !== 'uploading' && (
                      <p className="text-[11px] text-muted-foreground">Click to change file</p>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                    <p className="font-semibold text-sm text-foreground">Drop your .epub here</p>
                    <p className="text-xs text-muted-foreground">or click to browse · max 50 MB</p>
                  </>
                )}
              </div>

              {/* Progress bar */}
              {status === 'uploading' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading…
                    </span>
                    <span className="font-semibold tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {status === 'error' && (
                <div className="flex items-start gap-2 rounded-xl bg-destructive/10 text-destructive px-3 py-2.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter showCloseButton={status !== 'uploading'}>
            {status === 'success' ? (
              <button
                onClick={() => handleClose(false)}
                className="text-sm font-semibold text-brand hover:underline"
              >
                Done
              </button>
            ) : (
              <>
                {status === 'error' && (
                  <Button variant="outline" className="rounded-xl" onClick={reset}>
                    Try again
                  </Button>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={!file || status === 'uploading'}
                  className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-1.5"
                >
                  {status === 'uploading'
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                    : <><Upload className="w-4 h-4" />Upload</>}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
