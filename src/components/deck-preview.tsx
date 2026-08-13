import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/components/slide-canvas";
import { Chip, SectionHeading } from "@/components/primitives";
import { DECK_SIZE, type Deck } from "@/lib/deck/schema";
import { getDeckLength, getDeckStyle } from "@/lib/deck/styles";
import { cn } from "@/lib/utils";

function ScaledSlide({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DECK_SIZE.width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: DECK_SIZE.width, height: DECK_SIZE.height, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export function DeckPreview({ deck, onRestyle }: { deck: Deck; onRestyle?: () => void }) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<"pptx" | "pdf" | null>(null);
  const total = deck.slides.length;
  const current = deck.slides[index]!;
  const style = getDeckStyle(deck.style);
  const length = getDeckLength(deck.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const handleExport = async (format: "pptx" | "pdf") => {
    setBusy(format);
    try {
      const mod = await import("@/lib/deck/export");
      if (format === "pptx") await mod.exportPptx(deck);
      else await mod.exportPdf(deck);
      toast.success(`${format.toUpperCase()} downloaded.`);
    } catch {
      toast.error(`Could not build the ${format.toUpperCase()} file.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="animate-rise">
      <SectionHeading
        step="Step 04 — Deck Preview"
        note="Generated from your project documentation"
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Chip tone="ember">{style.name}</Chip>
        <Chip>{length.name}</Chip>
        <Chip>{total} slides</Chip>
        <Chip tone={deck.quality.gaps.length ? "warning" : "positive"}>
          {deck.quality.score}% evidence-backed
        </Chip>

        {onRestyle && (
          <Button variant="quiet" size="sm" className="ml-auto min-h-9" onClick={onRestyle}>
            <Palette className="size-4" />
            Try another style
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[190px_1fr]">
        <ol className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:pr-2">
          {deck.slides.map((slide, i) => (
            <li key={slide.id} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index}
                className={cn(
                  "w-40 overflow-hidden rounded-xl border bg-card text-left transition-all duration-300 hover:-translate-y-0.5 lg:w-full",
                  i === index
                    ? "border-ember shadow-lift"
                    : "border-border opacity-70 hover:opacity-100",
                )}
              >
                <ScaledSlide>
                  <SlideCanvas slide={slide} styleId={deck.style} />
                </ScaledSlide>
                <span className="block border-t border-border px-2 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                  {String(slide.number).padStart(2, "0")} · {slide.title}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div>
          <div className="overflow-hidden rounded-2xl border border-border shadow-lift">
            <ScaledSlide key={current.id}>
              <SlideCanvas slide={current} styleId={deck.style} />
            </ScaledSlide>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="quiet"
                size="sm"
                aria-label="Previous slide" className="min-h-11 min-w-11"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-mono text-sm text-muted-foreground">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <Button
                variant="quiet"
                size="sm"
                aria-label="Next slide" className="min-h-11 min-w-11"
                disabled={index === total - 1}
                onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="ink" size="lg" className="min-h-11" disabled={busy !== null} onClick={() => handleExport("pptx")}>
                <Download className="size-4" />
                {busy === "pptx" ? "Building…" : "Download Pitch Deck (PPTX)"}
              </Button>
              <Button variant="quiet" size="lg" className="min-h-11" disabled={busy !== null} onClick={() => handleExport("pdf")}>
                <FileText className="size-4" />
                {busy === "pdf" ? "Building…" : "Download PDF"}
              </Button>
            </div>
          </div>

          {deck.quality.gaps.length > 0 && (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Slides marked as gaps ({deck.quality.gaps.join(", ")}) disclose missing evidence rather
              than inventing figures.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
