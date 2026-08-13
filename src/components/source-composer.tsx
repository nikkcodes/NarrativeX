import { useCallback, useMemo, useRef, useState } from "react";
import { FileText, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chip, Eyebrow, Panel, StatusDot } from "@/components/primitives";
import { SOURCE_LIMITS, countWords, type PitchSource } from "@/lib/pitch/types";

interface SourceComposerProps {
  onGenerate: (source: PitchSource) => void;
  pending?: boolean;
}

export function SourceComposer({ onGenerate, pending = false }: SourceComposerProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeBytes, setSizeBytes] = useState<number | undefined>(undefined);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chars = text.length;
  const words = useMemo(() => countWords(text), [text]);
  const ready = chars >= SOURCE_LIMITS.minChars && chars <= SOURCE_LIMITS.maxChars;

  const readFile = useCallback((file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!SOURCE_LIMITS.acceptedExtensions.includes(ext as never)) {
      setError(`Unsupported file. Use ${SOURCE_LIMITS.acceptedExtensions.join(", ")}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? "").slice(0, SOURCE_LIMITS.maxChars));
      setFileName(file.name);
      setSizeBytes(file.size);
      setError(null);
    };
    reader.readAsText(file);
  }, []);

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <FileText className="size-3.5 text-ember" />
          <Eyebrow>README — Evidence source</Eyebrow>
        </div>
        <div className="flex items-center gap-2">
          {chars === 0 ? (
            <Chip>Awaiting source</Chip>
          ) : (
            <Chip tone={ready ? "positive" : "warning"} dot>
              {ready ? "Evidence detected" : "Too short"}
            </Chip>
          )}
        </div>
      </div>

      <div className="grid gap-px bg-border lg:grid-cols-[0.85fr_1.15fr]">
        {/* Upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) readFile(file);
          }}
          className={cn(
            "flex min-h-64 flex-col items-center justify-center bg-card p-7 text-center transition-colors duration-300",
            dragging && "bg-surface",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            aria-label="Upload a README file"
            accept={SOURCE_LIMITS.acceptedExtensions.join(",")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
          />
          <div
            className={cn(
              "grid size-14 place-items-center rounded-2xl border border-dashed border-border bg-surface transition-transform duration-300",
              dragging && "scale-110 border-ember",
            )}
          >
            <UploadCloud className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-medium">Drop your README here</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {SOURCE_LIMITS.acceptedExtensions.join(" · ")}
          </p>
          <Button
            variant="quiet"
            className="mt-5 min-h-11"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Browse files
          </Button>

          {fileName && (
            <div className="mt-6 flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left animate-rise">
              <FileText className="size-4 shrink-0 text-ember" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fileName}</p>
                <p className="rule-label">
                  {sizeBytes ? `${(sizeBytes / 1024).toFixed(1)} KB` : "loaded"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove file"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setFileName(null);
                  setSizeBytes(undefined);
                  setText("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Paste */}
        <div className="flex flex-col bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <span className="rule-label">Paste documentation</span>
            <span className="rule-label">
              {words.toLocaleString()} w · {chars.toLocaleString()} c
            </span>
          </div>
          <textarea
            value={text}
            aria-label="Paste your README or documentation"
            onChange={(e) => {
              setText(e.target.value.slice(0, SOURCE_LIMITS.maxChars));
              setError(null);
              if (fileName) setFileName(null);
            }}
            spellCheck={false}
            placeholder={"# Project\n\nWhat it does, who it's for, how it works…"}
            className="min-h-64 flex-1 resize-none bg-transparent p-4 font-mono text-[0.8rem] leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
          <div className="grid gap-3 border-t border-border px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <StatusDot tone={error ? "danger" : ready ? "positive" : "neutral"} />
              <span className="truncate">
                {error ??
                  (chars === 0
                    ? "Upload or paste your README to begin forging your pitch."
                    : ready
                      ? "Ready to forge."
                      : `At least ${SOURCE_LIMITS.minChars} characters needed.`)}
              </span>
            </p>
            <Button
              variant="ink"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
              disabled={!ready || pending}
              onClick={() =>
                onGenerate({
                  kind: fileName ? "file" : "paste",
                  content: text,
                  ...(fileName ? { fileName } : {}),
                  ...(sizeBytes !== undefined ? { sizeBytes } : {}),
                })
              }
            >
              <Sparkles className="size-4" />
              {pending ? "Analysing…" : "Analyse documentation"}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
