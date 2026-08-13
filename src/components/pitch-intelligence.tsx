import { FileWarning, Quote, ShieldCheck } from "lucide-react";
import { Chip, Eyebrow, Panel, SectionHeading, StatusDot } from "@/components/primitives";
import type { Pitch } from "@/lib/pitch/schema";

function hasText(value: string) {
  return value.trim().length > 0;
}

type Section =
  | { label: string; kind: "text"; value: string }
  | { label: string; kind: "list"; items: string[] }
  | { label: string; kind: "tags"; items: string[] };

function sectionsOf(pitch: Pitch): Section[] {
  return [
    { label: "Problem", kind: "text", value: pitch.problem },
    { label: "Solution", kind: "text", value: pitch.solution },
    { label: "Target users", kind: "list", items: pitch.target_users },
    { label: "Key features", kind: "list", items: pitch.key_features },
    { label: "Market opportunity", kind: "text", value: pitch.market_opportunity },
    { label: "Business model", kind: "text", value: pitch.business_model },
    { label: "Competitive advantage", kind: "list", items: pitch.competitive_advantage },
    { label: "Technology", kind: "tags", items: pitch.technology },
    { label: "Traction", kind: "text", value: pitch.traction },
    { label: "Roadmap", kind: "list", items: pitch.roadmap },
  ];
}

function isBacked(section: Section) {
  return section.kind === "text" ? hasText(section.value) : section.items.length > 0;
}

function EvidenceCard({ section }: { section: Section }) {
  const backed = isBacked(section);

  return (
    <Panel
      interactive={backed}
      className={backed ? "flex flex-col p-5" : "flex flex-col border-dashed bg-surface/50 p-5 shadow-none"}
    >
      <div className="flex items-start justify-between gap-3">
        <Eyebrow>{section.label}</Eyebrow>
        <span
          className="flex shrink-0 items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground"
          title={backed ? "Backed by your documentation" : "No supporting evidence detected"}
        >
          <StatusDot tone={backed ? "positive" : "neutral"} />
          {backed ? "Evidence" : "None"}
        </span>
      </div>

      {!backed ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Not enough evidence in your documentation for this section.
        </p>
      ) : section.kind === "text" ? (
        <p className="mt-3 text-sm leading-relaxed text-foreground">{section.value}</p>
      ) : section.kind === "tags" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {section.items.map((item) => (
            <Chip key={item}>{item}</Chip>
          ))}
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {section.items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ember" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ReadinessPanel({ pitch, sections }: { pitch: Pitch; sections: Section[] }) {
  const backed = sections.filter(isBacked);
  const missing = sections.filter((s) => !isBacked(s));
  const pct = Math.round((backed.length / sections.length) * 100);

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Eyebrow>Pitch readiness</Eyebrow>
        <span className="rule-label">Derived from your documentation</span>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="rule-label">Evidence coverage</p>
          <p className="mt-1 font-display text-3xl">
            {backed.length}
            <span className="text-muted-foreground">/{sections.length}</span>
          </p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-ember transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Sections backed by your source.</p>
        </div>

        <div>
          <p className="rule-label">Narrative</p>
          <p className="mt-1 font-display text-3xl">Ready</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Evidence analysis complete — no scores invented.
          </p>
        </div>

        <div>
          <p className="rule-label">Investor questions</p>
          <p className="mt-1 font-display text-3xl">{pitch.investor_questions.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">Diligence prompts anticipated.</p>
        </div>

        <div>
          <p className="rule-label">Market data</p>
          <p className="mt-1 font-display text-3xl">{pitch.market_data_available ? "Found" : "None"}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {pitch.market_data_available
              ? "Quantitative data present in your source."
              : "No quantitative figures — nothing estimated."}
          </p>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center gap-2">
            <FileWarning className="size-3.5 text-muted-foreground" />
            <span className="rule-label">Missing evidence</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.map((section) => (
              <Chip key={section.label} tone="warning">
                {section.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {pitch.confidence_notes.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <span className="rule-label">Confidence notes</span>
          <ul className="mt-3 space-y-2">
            {pitch.confidence_notes.map((note) => (
              <li key={note} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

export function PitchIntelligence({ pitch }: { pitch: Pitch }) {
  const sections = sectionsOf(pitch);

  return (
    <section className="animate-rise">
      <SectionHeading step="Step 02 — Pitch Intelligence" note="Grounded in your documentation" />

      <Panel className="mt-8 overflow-hidden">
        <div className="relative border-b border-border p-7 sm:p-9">
          <div className="pointer-events-none absolute inset-0 micro-grid [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="positive" dot>
                Source-backed
              </Chip>
              <Chip>Evidence model</Chip>
            </div>
            {hasText(pitch.project_name) && (
              <h3 className="mt-4 text-4xl sm:text-5xl">{pitch.project_name}</h3>
            )}
            {hasText(pitch.tagline) && (
              <p className="mt-3 max-w-2xl font-display text-xl italic text-ember">{pitch.tagline}</p>
            )}
          </div>
        </div>

        <div className="bg-surface/40 p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-chart-3" />
            <span className="rule-label">README — Evidence source</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <EvidenceCard key={section.label} section={section} />
            ))}
          </div>
        </div>
      </Panel>

      <div className="mt-6">
        <ReadinessPanel pitch={pitch} sections={sections} />
      </div>

      {pitch.investor_questions.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <Quote className="size-3.5 text-ember" />
            <span className="rule-label">Investor insights — likely diligence</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {pitch.investor_questions.map((question, i) => (
              <Panel key={question} interactive className="p-6">
                <span className="font-mono text-2xl text-ember/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 leading-relaxed text-foreground">{question}</p>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {hasText(pitch.call_to_action) && (
        <Panel className="mt-6 border-ember/30 bg-ember/5 p-6">
          <span className="rule-label">Call to action</span>
          <p className="mt-2 font-display text-xl leading-snug">{pitch.call_to_action}</p>
        </Panel>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        Empty sections mean your documentation didn't provide evidence for them — nothing is
        invented.
      </p>
    </section>
  );
}
