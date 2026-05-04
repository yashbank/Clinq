"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ".pdf,.txt,.md,application/pdf,text/plain";

type Phase = "idle" | "drag" | "reading" | "parsing" | "success" | "error";

export function ResumeUploadZone({
  resumeText,
  resumeFilename,
  onExtracted,
  className,
}: {
  resumeText: string;
  resumeFilename: string;
  onExtracted: (text: string, filename: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_BYTES) return "File is too large (max 4 MB).";
    const ok = /\.(pdf|txt|md)$/i.test(f.name);
    if (!ok) return "Use a PDF, .txt, or .md file.";
    return null;
  };

  const processFile = useCallback(
    async (f: File) => {
      const err = validateFile(f);
      if (err) {
        setMessage(err);
        setPhase("error");
        toast.error(err);
        return;
      }
      setMessage(null);
      setPhase("reading");

      try {
        if (/\.pdf$/i.test(f.name)) {
          setPhase("parsing");
          const fd = new FormData();
          fd.append("file", f);
          const res = await fetch("/api/profile/parse-resume", { method: "POST", body: fd });
          const json = (await res.json().catch(() => null)) as { text?: string; pages?: number | null; error?: string } | null;
          if (!res.ok) {
            const m = json?.error ?? "Could not parse PDF";
            setMessage(m);
            setPhase("error");
            toast.error(m);
            return;
          }
          const text = (json?.text ?? "").slice(0, 48_000);
          onExtracted(text, f.name);
          setPhase("success");
          toast.success("Resume text extracted");
          window.setTimeout(() => setPhase("idle"), 1600);
          return;
        }
        const text = await f.text();
        onExtracted(text.slice(0, 48_000), f.name);
        setPhase("success");
        toast.success("Resume loaded");
        window.setTimeout(() => setPhase("idle"), 1600);
      } catch {
        setMessage("Could not read file.");
        setPhase("error");
        toast.error("Could not read file");
      }
    },
    [onExtracted],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void processFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhase("idle");
    const f = e.dataTransfer.files?.[0];
    if (f) void processFile(f);
  };

  const busy = phase === "reading" || phase === "parsing";
  const lines = resumeText ? resumeText.split(/\r?\n/).length : 0;
  const words = resumeText ? resumeText.split(/\s+/).filter(Boolean).length : 0;
  const preview = resumeText.slice(0, 520);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={() => setPhase((p) => (p === "idle" || p === "success" || p === "error" ? "drag" : p))}
        onDragOver={(e) => {
          e.preventDefault();
          setPhase((p) => (p !== "reading" && p !== "parsing" ? "drag" : p));
        }}
        onDragLeave={() => setPhase((p) => (p === "drag" ? "idle" : p))}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed transition-[border-color,background-color,box-shadow] duration-300 ease-out",
          phase === "drag" ? "border-primary/50 bg-primary/[0.06] shadow-[0_0_0_1px_oklch(0.65_0.14_200/0.2)]" : "border-clinq-glass-border/80 bg-background/30",
          busy && "pointer-events-none cursor-wait opacity-90",
        )}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInputChange} />
        <div className="flex flex-col items-center px-6 py-12 text-center sm:py-14">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border border-clinq-glass-border/70 transition-transform duration-500 ease-out",
              phase === "drag" && "scale-[1.03]",
              busy && "animate-pulse",
            )}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : phase === "success" ? (
              <CheckCircle2 className="h-6 w-6 text-clinq-success" />
            ) : phase === "error" ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" strokeWidth={1.5} />
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            {busy ? (phase === "parsing" ? "Extracting text from PDF…" : "Reading file…") : "Drop a resume here, or click to browse"}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">PDF (server parse), or plain .txt / .md · max 4 MB</p>
          {message ? <p className="mt-3 text-xs text-destructive">{message}</p> : null}
        </div>
      </div>

      {resumeText ? (
        <div className="overflow-hidden rounded-xl border border-clinq-glass-border/60 bg-background/25">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-clinq-glass-border/50 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">{resumeFilename || "Resume"}</span>
              <span className="tabular-nums">
                · {lines.toLocaleString()} lines · {words.toLocaleString()} words
              </span>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto px-4 py-3">
            <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
              {preview}
              {resumeText.length > preview.length ? "…" : ""}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">No file loaded yet. Text below stays editable after upload.</p>
      )}
    </div>
  );
}
