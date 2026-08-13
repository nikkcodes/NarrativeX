import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow, Panel } from "@/components/primitives";

export const DECK_STAGES = [
  "Understanding your project",
  "Building the investor narrative",
  "Designing the slides",
  "Preparing your deck",
  "Ready to present",
] as const;

interface AnalysisProgressProps {
  /** Index of the stage currently in flight; earlier stages render as complete. */
  stage: number;
  stages?: readonly string[];
  label?: string;
}

export function AnalysisProgress({
  stage,
  stages = DECK_STAGES,
  label = "Generating",
}: AnalysisProgressProps) {
  const pct = Math.round(((stage + 1) / stages.length) * 100);

  return (
    <Panel className="overflow-hidden animate-rise">
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Loader2 className="size-4 shrink-0 text-ember motion-safe:animate-spin" />
          <span className="truncate font-display text-lg">{label}</span>
        </div>
        <Eyebrow>{pct}%</Eyebrow>
      </div>

      <div className="h-0.5 w-full bg-border">
        <div
          className="h-full bg-ember transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="space-y-1 p-5 sm:p-6">
        {stages.map((item, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li
              key={item}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-500",
                active && "bg-surface",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-[0.6rem]",
                  done && "border-chart-3/50 bg-chart-3/15 text-chart-3",
                  active && "border-ember bg-ember/10 text-ember",
                  !done && !active && "border-border text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {done ? (
                  <Check className="size-3" />
                ) : active ? (
                  <span className="size-1.5 rounded-full bg-ember motion-safe:animate-pulse" />
                ) : (
                  <span className="size-1.5 rounded-full bg-border" />
                )}
              </span>
              <span
                className={cn(
                  "text-sm sm:text-base",
                  done && "text-muted-foreground",
                  active && "font-medium text-foreground",
                  !done && !active && "text-muted-foreground/60",
                )}
              >
                {item}
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
