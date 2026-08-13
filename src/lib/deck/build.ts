import type { Pitch } from "@/lib/pitch/schema";
import {
  NO_MARKET_DATA_NOTE,
  type Deck,
  type DeckBullet,
  type DeckColumn,
  type DeckMetric,
  type DeckOptions,
  type DeckPhase,
  type DeckSlide,
  type SlideLayout,
} from "@/lib/deck/schema";
import { getDeckLength, getDeckStyle } from "@/lib/deck/styles";

const MISSING = "Not stated in the source documentation.";

function text(value: string, fallback = MISSING) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function has(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.filter((v) => v.trim()).length > 0;
  return Boolean(value && value.trim());
}

function splitSentences(value: string): string[] {
  return (value ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function bullets(items: string[], max = 6): DeckBullet[] {
  return items
    .filter((i) => i.trim())
    .slice(0, max)
    .map((item) => {
      const [label, ...rest] = item.split(/\s[—–-]\s|:\s/);
      return { label: (label ?? item).trim(), detail: rest.join(" — ").trim() };
    });
}

function headline(value: string, max = 90): string {
  const first = splitSentences(value)[0] ?? value;
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

/* ------------------------------------------------------------------ seeds */

type SectionTier = 1 | 2 | 3;

interface SectionSeed extends Partial<Omit<DeckSlide, "id" | "number" | "layout">> {
  /** Stable key used by the quality report. */
  key: string;
  layout: SlideLayout;
  eyebrow: string;
  title: string;
  tier: SectionTier;
  /** False when the source documentation had no evidence for this section. */
  supported: boolean;
  /** Rendered even without evidence (as an honest gap slide). */
  keepWhenEmpty?: boolean;
}

function toSlide(seed: SectionSeed, number: number, label: string): DeckSlide {
  return {
    id: `slide-${number}`,
    number,
    layout: seed.layout,
    eyebrow: label,
    title: seed.title,
    subtitle: seed.subtitle ?? "",
    body: seed.body ?? "",
    bullets: seed.bullets ?? [],
    steps: seed.steps ?? [],
    tags: seed.tags ?? [],
    metrics: seed.metrics ?? [],
    columns: seed.columns ?? [],
    phases: seed.phases ?? [],
    note: seed.note ?? "",
    closing: seed.closing ?? "",
  };
}

/** Derives a 3–5 step "how it works" flow from available evidence only. */
function deriveFlow(pitch: Pitch): string[] {
  const fromFeatures = pitch.key_features
    .slice(0, 5)
    .map((f) => (f.split(/\s[—–-]\s|:\s/)[0] ?? f).trim());
  if (fromFeatures.length >= 3) return fromFeatures;
  const fromSolution = splitSentences(pitch.solution).slice(0, 5);
  if (fromSolution.length >= 3) return fromSolution;
  return [...fromFeatures, ...fromSolution].slice(0, 5);
}

function derivePhases(pitch: Pitch): DeckPhase[] {
  return pitch.roadmap.slice(0, 4).map((item, i) => {
    const [label, ...rest] = item.split(/\s[—–-]\s|:\s/);
    return {
      phase: `Phase ${i + 1}`,
      label: (label ?? item).trim(),
      detail: rest.join(" — ").trim(),
    };
  });
}

/** Qualitative metric cards — never numeric unless the source stated numbers. */
function deriveTractionMetrics(pitch: Pitch): DeckMetric[] {
  const cards: DeckMetric[] = [];
  if (has(pitch.traction)) {
    cards.push({ value: "Stated", label: "Traction in documentation", detail: headline(pitch.traction, 90) });
  }
  if (pitch.key_features.length) {
    cards.push({
      value: String(pitch.key_features.length),
      label: "Documented capabilities",
      detail: "Counted from the source documentation, not from usage data.",
    });
  }
  if (pitch.technology.length) {
    cards.push({
      value: String(pitch.technology.length),
      label: "Technologies in the stack",
      detail: "Listed in the source documentation.",
    });
  }
  return cards.slice(0, 3);
}

function buildSections(pitch: Pitch): SectionSeed[] {
  const name = text(pitch.project_name, "Untitled Project");
  const problemPoints = splitSentences(pitch.problem);
  const solutionPoints = splitSentences(pitch.solution);
  const flow = deriveFlow(pitch);
  const phases = derivePhases(pitch);
  const metrics = deriveTractionMetrics(pitch);

  return [
    {
      key: "cover",
      tier: 1,
      supported: true,
      layout: "cover",
      eyebrow: "Investor Pitch",
      title: name,
      subtitle: text(pitch.tagline, ""),
      body: solutionPoints[0] ?? "",
      tags: pitch.technology.slice(0, 4),
    },
    {
      key: "problem",
      tier: 1,
      supported: has(pitch.problem),
      keepWhenEmpty: true,
      layout: has(pitch.problem) ? "statement" : "gap",
      eyebrow: "The Problem",
      title: "The problem",
      body: problemPoints[0] ?? "No problem statement was present in the source documentation.",
      bullets: bullets(problemPoints.slice(1, 5), 4),
      subtitle: has(pitch.problem) ? "Why this matters now" : "Add a problem statement to your README to strengthen this slide.",
    },
    {
      key: "why-now",
      tier: 3,
      supported: has(pitch.market_opportunity) || has(pitch.problem),
      layout: "statement",
      eyebrow: "Why Now",
      title: "Why now",
      body: text(pitch.market_opportunity, headline(pitch.problem, 200)),
      note: pitch.market_data_available ? "" : NO_MARKET_DATA_NOTE,
    },
    {
      key: "solution",
      tier: 1,
      supported: has(pitch.solution),
      keepWhenEmpty: true,
      layout: has(pitch.solution) ? "split" : "gap",
      eyebrow: "The Solution",
      title: "The solution",
      body: text(pitch.solution, "No solution description was present in the source documentation."),
      bullets: bullets(pitch.key_features.slice(0, 4)),
      subtitle: has(pitch.solution) ? "How it answers the problem" : "",
    },
    {
      key: "how-it-works",
      tier: 2,
      supported: flow.length >= 3,
      layout: "flow",
      eyebrow: "Product",
      title: "How it works",
      steps: flow,
    },
    {
      key: "workflow",
      tier: 3,
      supported: flow.length >= 3,
      layout: "process",
      eyebrow: "Product",
      title: "The user journey",
      steps: flow.slice(0, 4),
      note: "Derived from documented capabilities — no usage research is claimed.",
    },
    {
      key: "features",
      tier: 1,
      supported: pitch.key_features.length > 0,
      keepWhenEmpty: true,
      layout: pitch.key_features.length ? "features" : "gap",
      eyebrow: "Product",
      title: "Key features",
      bullets: bullets(pitch.key_features, 6),
      body: pitch.key_features.length ? "" : "No feature detail was present in the source documentation.",
    },
    {
      key: "market",
      tier: 1,
      supported: has(pitch.market_opportunity) || pitch.target_users.length > 0,
      keepWhenEmpty: true,
      layout: "market",
      eyebrow: "Market",
      title: "Target market",
      body: text(pitch.market_opportunity, "No market description was present in the source documentation."),
      bullets: bullets(pitch.target_users, 5),
      subtitle: "Who this is for",
      note: pitch.market_data_available ? "" : NO_MARKET_DATA_NOTE,
    },
    {
      key: "landscape",
      tier: 3,
      supported: pitch.competitive_advantage.length > 0,
      layout: "matrix",
      eyebrow: "Landscape",
      title: "How we compare",
      columns: [
        {
          title: name,
          items: pitch.competitive_advantage.slice(0, 5),
          highlight: true,
        },
        {
          title: "Typical alternatives",
          items: ["Not named in the source documentation"],
          highlight: false,
        },
      ] satisfies DeckColumn[],
      note: "No competitor is named — the documentation does not identify any.",
    },
    {
      key: "advantage",
      tier: 2,
      supported: pitch.competitive_advantage.length > 0,
      layout: "advantage",
      eyebrow: "Defensibility",
      title: "Competitive advantage",
      bullets: bullets(pitch.competitive_advantage, 4),
    },
    {
      key: "technology",
      tier: 2,
      supported: pitch.technology.length > 0,
      layout: "architecture",
      eyebrow: "Technology",
      title: "Architecture & stack",
      tags: pitch.technology.slice(0, 10),
      columns: pitch.technology.length
        ? ([
            { title: "Stack", items: pitch.technology.slice(0, 6), highlight: true },
            ...(pitch.technology.length > 6
              ? [{ title: "Supporting", items: pitch.technology.slice(6, 12), highlight: false }]
              : []),
          ] satisfies DeckColumn[])
        : [],
      body: pitch.competitive_advantage[0] ?? "",
    },
    {
      key: "model",
      tier: 1,
      supported: has(pitch.business_model),
      keepWhenEmpty: true,
      layout: "model",
      eyebrow: "Business",
      title: "Business model",
      subtitle: has(pitch.business_model) ? "Stated in documentation" : "Not stated in documentation",
      body: text(pitch.business_model, "The documentation does not describe how the product makes money."),
      bullets: bullets(pitch.target_users.slice(0, 3)),
      note: "No revenue figures are claimed — none were provided.",
    },
    {
      key: "traction",
      tier: 2,
      supported: has(pitch.traction),
      keepWhenEmpty: true,
      layout: metrics.length ? "metrics" : "gap",
      eyebrow: "Traction",
      title: "Where we are today",
      metrics,
      body: has(pitch.traction) ? pitch.traction : "No traction, revenue or user figures were provided.",
      subtitle: has(pitch.traction) ? "" : "Nothing is invented here — add real metrics to your documentation to fill this slide.",
      note: has(pitch.traction) ? "" : "No quantitative traction is claimed.",
    },
    {
      key: "gtm",
      tier: 3,
      supported: pitch.target_users.length > 0,
      layout: "process",
      eyebrow: "Go To Market",
      title: "Reaching these users",
      steps: pitch.target_users.slice(0, 4).map((u) => `Reach ${u}`),
      note: "Channels derived from documented user segments — no spend or CAC is claimed.",
    },
    {
      key: "roadmap",
      tier: 1,
      supported: pitch.roadmap.length > 0,
      keepWhenEmpty: true,
      layout: phases.length ? "timeline" : "gap",
      eyebrow: "Roadmap",
      title: "Where this goes",
      phases,
      body: phases.length ? "" : "No roadmap was present in the source documentation.",
    },
    {
      key: "questions",
      tier: 2,
      supported: pitch.investor_questions.length > 0,
      layout: "questions",
      eyebrow: "Investor Lens",
      title: "Questions we expect",
      steps: pitch.investor_questions.slice(0, 3),
      body: "Prepared from the gaps and claims found in your documentation.",
    },
    {
      key: "vision",
      tier: 3,
      supported: has(pitch.tagline) || has(pitch.call_to_action),
      layout: "quote",
      eyebrow: "Vision",
      title: name,
      body: text(pitch.tagline, headline(pitch.solution, 160)),
      closing: text(pitch.call_to_action, ""),
    },
    {
      key: "closing",
      tier: 1,
      supported: true,
      layout: "closing",
      eyebrow: "The Ask",
      title: has(pitch.call_to_action) ? "Let's talk" : name,
      body: text(pitch.tagline, ""),
      closing: text(pitch.call_to_action, "Contact details are not stated in the source documentation."),
    },
  ];
}

/* ------------------------------------------------------------------ build */

/**
 * Pure, deterministic mapping: structured pitch data → a styled, length-aware
 * investor deck. Nothing here invents content; gaps are disclosed instead.
 *
 * @param pitch - The analysed pitch data.
 * @param options - Chosen deck style and narrative length.
 * @param generatedAt - ISO timestamp for the deck record.
 * @returns A complete deck ready for preview and export.
 */
export function buildDeck(
  pitch: Pitch,
  options: DeckOptions = { style: "modern-startup", length: "standard" },
  generatedAt = new Date().toISOString(),
): Deck {
  const style = getDeckStyle(options.style);
  const length = getDeckLength(options.length);
  const sections = buildSections(pitch);

  let selected = sections.filter(
    (s) => s.tier <= length.tier && (s.supported || s.keepWhenEmpty),
  );

  // Trim the least essential sections if the deck runs long.
  while (selected.length > length.max) {
    const dropIndex = selected
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.tier > 1 && !s.keepWhenEmpty)
      .sort((a, b) => b.s.tier - a.s.tier || Number(a.s.supported) - Number(b.s.supported))[0]?.i;
    if (dropIndex === undefined) break;
    selected.splice(dropIndex, 1);
  }

  // Add supported optional sections back if the deck runs short.
  if (selected.length < length.min) {
    const extras = sections.filter((s) => !selected.includes(s) && s.supported);
    for (const extra of extras) {
      if (selected.length >= length.min) break;
      const at = sections.indexOf(extra);
      const before = selected.findIndex((s) => sections.indexOf(s) > at);
      selected.splice(before === -1 ? selected.length : before, 0, extra);
    }
  }

  // Section dividers only in the longest format, and only for styles that use them.
  if (length.tier === 3 && style.favours.includes("divider")) {
    const marker = selected.findIndex((s) => s.key === "market");
    if (marker > 0) {
      selected.splice(marker, 0, {
        key: "divider-market",
        tier: 3,
        supported: true,
        layout: "divider",
        eyebrow: "Part Two",
        title: "Market & business",
        subtitle: "How this becomes a company.",
      });
    }
  }

  selected = selected.slice(0, length.max);

  const slides = selected.map((seed, i) => {
    const index = i + 1;
    const label =
      seed.layout === "cover" || seed.layout === "divider"
        ? seed.eyebrow
        : `${String(index).padStart(2, "0")} — ${seed.eyebrow}`;
    return toSlide(seed, index, label);
  });

  const supported = selected.filter((s) => s.supported).map((s) => s.eyebrow);
  const gaps = selected.filter((s) => !s.supported).map((s) => s.eyebrow);

  return {
    title: text(pitch.project_name, "Untitled Project"),
    subtitle: text(pitch.tagline, "Investor pitch deck"),
    generatedAt,
    style: style.id,
    length: length.id,
    quality: {
      supported,
      gaps,
      score: Math.round((supported.length / Math.max(1, selected.length)) * 100),
    },
    slides,
  };
}
