import { Link } from "@tanstack/react-router";
import { Chip } from "@/components/primitives";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Mark className="size-7 shrink-0" />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-xl tracking-tight">NarrativeX</span>
            <span className="mt-0.5 hidden truncate font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              AI Pitch Intelligence
            </span>
          </span>
          <Chip tone="ember" className="ml-2 hidden lg:inline-flex">
            Pay-per-generation
          </Chip>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/workspace"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            activeProps={{ className: "text-ember" }}
          >
            Workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Mark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" className="fill-ink" />
      <path
        d="M7 17.5V6.5l6 11v-11"
        className="stroke-ink-foreground"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />

      <path d="M15.5 6.5 19 12l-3.5 5.5" className="stroke-ember" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <Mark className="size-5" />
          <span className="rule-label">NarrativeX — {new Date().getFullYear()}</span>
        </div>
        <span className="rule-label">x402 · Algorand TestNet · USDC</span>
      </div>
    </footer>
  );
}
