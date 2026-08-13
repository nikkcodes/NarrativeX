import { Check } from "lucide-react";
import { Chip, Panel, SectionHeading } from "@/components/primitives";
import {
  DECK_LENGTH_LIST,
  DECK_STYLE_LIST,
  getDeckStyle,
  type DeckLengthId,
  type DeckStyleId,
} from "@/lib/deck/styles";
import { cn } from "@/lib/utils";

function Swatch({ styleId }: { styleId: DeckStyleId }) {
  const { palette } = getDeckStyle(styleId);
  return (
    <div
      className="relative h-16 w-full overflow-hidden rounded-md border border-border"
      style={{ backgroundColor: `#${palette.bg}` }}
      aria-hidden="true"
    >
      <div className="absolute left-3 top-3 h-1.5 w-8" style={{ backgroundColor: `#${palette.accent}` }} />
      <div className="absolute left-3 top-7 h-2 w-24 rounded-sm" style={{ backgroundColor: `#${palette.ink}` }} />
      <div className="absolute left-3 top-11 h-1.5 w-16 rounded-sm" style={{ backgroundColor: `#${palette.muted}` }} />
      <div
        className="absolute bottom-2 right-2 h-8 w-16 rounded"
        style={{ backgroundColor: `#${palette.panelAlt}`, border: `1px solid #${palette.rule}` }}
      />
    </div>
  );
}

export interface DeckConfigProps {
  style: DeckStyleId;
  length: DeckLengthId;
  recommended: DeckStyleId;
  recommendationReason: string;
  disabled?: boolean;
  onStyleChange: (style: DeckStyleId) => void;
  onLengthChange: (length: DeckLengthId) => void;
}

/** Style and narrative-length picker shown before the deck is generated. */
export function DeckConfig({
  style,
  length,
  recommended,
  recommendationReason,
  disabled,
  onStyleChange,
  onLengthChange,
}: DeckConfigProps) {
  return (
    <section className="animate-rise">
      <SectionHeading step="Step 03 — Deck Format" note={recommendationReason} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DECK_STYLE_LIST.map((option) => {
          const active = option.id === style;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onStyleChange(option.id)}
              className={cn(
                "group rounded-xl border bg-card p-4 text-left transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60",
                active ? "border-ember shadow-lift" : "border-border hover:border-foreground/25",
              )}
            >
              <Swatch styleId={option.id} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-display text-lg leading-tight">{option.name}</span>
                {active ? (
                  <Check className="size-4 shrink-0 text-ember" aria-hidden="true" />
                ) : option.id === recommended ? (
                  <Chip tone="ember">Suggested</Chip>
                ) : null}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{option.summary}</p>
              <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                {option.bestFor}
              </p>
            </button>
          );
        })}
      </div>

      <Panel className="mt-4 p-4 sm:p-5">
        <span className="rule-label">Deck length</span>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {DECK_LENGTH_LIST.map((option) => {
            const active = option.id === length;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onLengthChange(option.id)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60",
                  active
                    ? "border-ember bg-surface"
                    : "border-border hover:border-foreground/25",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{option.name}</span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {option.label}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.summary}</p>
              </button>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}
