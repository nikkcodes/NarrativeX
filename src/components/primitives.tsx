import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small monospace uppercase label used to title sections and cards. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("rule-label", className)}>{children}</span>;
}

type Tone = "neutral" | "positive" | "ember" | "warning" | "danger";

const DOT_TONE: Record<Tone, string> = {
  neutral: "bg-muted-foreground/50",
  positive: "bg-chart-3",
  ember: "bg-ember",
  warning: "bg-chart-4",
  danger: "bg-destructive",
};

const CHIP_TONE: Record<Tone, string> = {
  neutral: "border-border bg-surface text-muted-foreground",
  positive: "border-chart-3/35 bg-chart-3/8 text-foreground",
  ember: "border-ember/35 bg-ember/8 text-foreground",
  warning: "border-chart-4/40 bg-chart-4/10 text-foreground",
  danger: "border-destructive/35 bg-destructive/8 text-destructive",
};

/** A tiny status dot; `pulse` marks an in-flight state. */
export function StatusDot({ tone = "neutral", pulse = false }: { tone?: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2 shrink-0 items-center justify-center">
      {pulse && (
        <span
          className={cn("absolute inline-flex size-2 rounded-full opacity-60 motion-safe:animate-ping", DOT_TONE[tone])}
        />
      )}
      <span className={cn("relative inline-flex size-1.5 rounded-full", DOT_TONE[tone])} />
    </span>
  );
}

/** Compact pill for statuses, tags and technical markers. */
export function Chip({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.12em]",
        CHIP_TONE[tone],
        className,
      )}
    >
      {dot && <StatusDot tone={tone === "neutral" ? "neutral" : tone} />}
      {children}
    </span>
  );
}

/** Standard elevated panel used across the workspace. */
export function Panel({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-paper",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section heading with an eyebrow rule and an optional right-hand note. */
export function SectionHeading({
  step,
  title,
  note,
}: {
  step: string;
  title?: string;
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-4">
      <div className="min-w-0">
        <Eyebrow>{step}</Eyebrow>
        {title && <h2 className="mt-2 truncate text-2xl sm:text-3xl">{title}</h2>}
      </div>
      {note && <span className="rule-label">{note}</span>}
    </div>
  );
}

/** Structured failure card: what happened + what to do next. */
export function StateCard({
  kind = "error",
  title,
  what,
  next,
  className,
}: {
  kind?: "error" | "warning" | "info";
  title: string;
  what: ReactNode;
  next?: ReactNode;
  className?: string;
}) {
  const tone =
    kind === "error"
      ? "border-destructive/35 bg-destructive/5"
      : kind === "warning"
        ? "border-chart-4/45 bg-chart-4/8"
        : "border-border bg-surface";
  return (
    <div role={kind === "info" ? undefined : "alert"} className={cn("rounded-2xl border p-5 animate-rise", tone, className)}>
      <div className="flex items-center gap-2">
        <StatusDot tone={kind === "error" ? "danger" : kind === "warning" ? "warning" : "neutral"} />
        <span className="rule-label">{title}</span>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="rule-label">What happened</dt>
          <dd className="mt-1 leading-relaxed text-foreground">{what}</dd>
        </div>
        {next && (
          <div>
            <dt className="rule-label">Next step</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">{next}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/** Neutral placeholder for sections that have no data yet. */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="font-display text-xl">{title}</p>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Truncates an Algorand address for display. Never mutates the value. */
export function shortAddress(address: string, lead = 4, tail = 6): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}
