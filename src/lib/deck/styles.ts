import type { Pitch } from "@/lib/pitch/schema";

/**
 * Deck styles are structural, not cosmetic: each one carries its own palette,
 * type roles, density and composition traits, and the layout engine reads all
 * of them when it draws a slide.
 */
export const deckStyleIds = [
  "investor-minimal",
  "dark-tech",
  "modern-startup",
  "data-driven",
  "bold-founder",
  "editorial",
] as const;

export type DeckStyleId = (typeof deckStyleIds)[number];

export type FontRole = "display" | "body" | "mono";

export interface DeckPalette {
  bg: string;
  panel: string;
  panelAlt: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  rule: string;
}

export interface DeckStyle {
  id: DeckStyleId;
  name: string;
  summary: string;
  bestFor: string;
  palette: DeckPalette;
  /** Concrete families per role, for DOM preview, PPTX and PDF. */
  fonts: Record<FontRole, { css: string; pptx: string; pdf: "times" | "helvetica" | "courier" }>;
  /** Multiplies every type size — bold styles shout, editorial whispers. */
  scale: number;
  margin: number;
  radius: number;
  /** Max bullets/cards a slide may carry before content is trimmed. */
  density: number;
  /** Eyebrow labels rendered in uppercase with tracking. */
  capsEyebrow: boolean;
  /** Cover treatment. */
  cover: "rule" | "band" | "block" | "split" | "full";
  /** Header treatment on content slides. */
  header: "rule" | "bar" | "stack" | "side";
  /** Cards get a filled panel, an outline, or nothing at all. */
  card: "filled" | "outline" | "bare";
  /** Slides the style leans on when the content allows a choice. */
  favours: readonly string[];
}

const SANS = { css: '"Helvetica Neue", Helvetica, Arial, sans-serif', pptx: "Calibri", pdf: "helvetica" } as const;
const SANS_BLACK = { css: '"Arial Black", "Helvetica Neue", Arial, sans-serif', pptx: "Arial Black", pdf: "helvetica" } as const;
const SERIF = { css: 'Georgia, "Times New Roman", serif', pptx: "Georgia", pdf: "times" } as const;
const MONO = { css: '"IBM Plex Mono", Consolas, "Courier New", monospace', pptx: "Consolas", pdf: "courier" } as const;

export const DECK_STYLES: Record<DeckStyleId, DeckStyle> = {
  "investor-minimal": {
    id: "investor-minimal",
    name: "Investor Minimal",
    summary: "Neutral paper, hairline rules, typography doing all the work.",
    bestFor: "Classic YC / seed-round reading decks",
    palette: {
      bg: "FFFFFF",
      panel: "F6F5F3",
      panelAlt: "EFEEEB",
      ink: "141210",
      muted: "6B665F",
      accent: "141210",
      accentInk: "FFFFFF",
      rule: "DEDCD7",
    },
    fonts: { display: SANS, body: SANS, mono: MONO },
    scale: 1,
    margin: 88,
    radius: 0,
    density: 5,
    capsEyebrow: true,
    cover: "rule",
    header: "rule",
    card: "outline",
    favours: ["statement", "split", "features"],
  },
  "dark-tech": {
    id: "dark-tech",
    name: "Dark Tech",
    summary: "Deep console background, mono labels, high-contrast diagrams.",
    bestFor: "AI, SaaS and developer infrastructure",
    palette: {
      bg: "0B0F14",
      panel: "141C25",
      panelAlt: "1B2530",
      ink: "E9EFF6",
      muted: "8CA0B3",
      accent: "2DD4A7",
      accentInk: "062018",
      rule: "22303D",
    },
    fonts: { display: SANS, body: SANS, mono: MONO },
    scale: 0.98,
    margin: 80,
    radius: 10,
    density: 6,
    capsEyebrow: true,
    cover: "block",
    header: "bar",
    card: "filled",
    favours: ["architecture", "process", "metrics"],
  },
  "modern-startup": {
    id: "modern-startup",
    name: "Modern Startup",
    summary: "Soft gradients, elegant cards, bold contemporary section heads.",
    bestFor: "Product-led consumer and B2B startups",
    palette: {
      bg: "FBFBFE",
      panel: "FFFFFF",
      panelAlt: "EFF0FB",
      ink: "121826",
      muted: "5C6478",
      accent: "5B5BD6",
      accentInk: "FFFFFF",
      rule: "E4E6F2",
    },
    fonts: { display: SANS, body: SANS, mono: MONO },
    scale: 1.02,
    margin: 84,
    radius: 18,
    density: 6,
    capsEyebrow: true,
    cover: "band",
    header: "stack",
    card: "filled",
    favours: ["features", "process", "split"],
  },
  "data-driven": {
    id: "data-driven",
    name: "Data Driven",
    summary: "Metric cards, comparison matrices and analytical framing.",
    bestFor: "Evidence-heavy, analytical investor audiences",
    palette: {
      bg: "F6F9FB",
      panel: "FFFFFF",
      panelAlt: "E7F0F5",
      ink: "0F1B2A",
      muted: "56697B",
      accent: "0E7490",
      accentInk: "FFFFFF",
      rule: "D8E4EC",
    },
    fonts: { display: SANS, body: SANS, mono: MONO },
    scale: 0.98,
    margin: 80,
    radius: 8,
    density: 6,
    capsEyebrow: true,
    cover: "split",
    header: "bar",
    card: "outline",
    favours: ["metrics", "matrix", "market"],
  },
  "bold-founder": {
    id: "bold-founder",
    name: "Bold Founder",
    summary: "Enormous type, one idea per slide, dramatic dark transitions.",
    bestFor: "Live pitching and demo-day storytelling",
    palette: {
      bg: "101010",
      panel: "1B1B1B",
      panelAlt: "262626",
      ink: "FFFFFF",
      muted: "B6B2AC",
      accent: "FFC94A",
      accentInk: "1A1400",
      rule: "2E2E2E",
    },
    fonts: { display: SANS_BLACK, body: SANS, mono: MONO },
    scale: 1.14,
    margin: 92,
    radius: 4,
    density: 4,
    capsEyebrow: true,
    cover: "full",
    header: "stack",
    card: "bare",
    favours: ["statement", "quote", "divider"],
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    summary: "Magazine composition, asymmetric columns, generous whitespace.",
    bestFor: "Narrative-first, story-led pitches",
    palette: {
      bg: "FBF7F0",
      panel: "FFFDF9",
      panelAlt: "F2ECE1",
      ink: "241F1A",
      muted: "6E655A",
      accent: "C2410C",
      accentInk: "FFFFFF",
      rule: "E3DACB",
    },
    fonts: { display: SERIF, body: SANS, mono: MONO },
    scale: 1,
    margin: 96,
    radius: 14,
    density: 5,
    capsEyebrow: true,
    cover: "rule",
    header: "side",
    card: "filled",
    favours: ["quote", "split", "statement"],
  },
};

export const DECK_STYLE_LIST = deckStyleIds.map((id) => DECK_STYLES[id]);

export function getDeckStyle(id: string | undefined): DeckStyle {
  return DECK_STYLES[(id as DeckStyleId) ?? "modern-startup"] ?? DECK_STYLES["modern-startup"];
}

/* ------------------------------------------------------------------ length */

export const deckLengthIds = ["quick", "standard", "deep"] as const;
export type DeckLengthId = (typeof deckLengthIds)[number];

export interface DeckLength {
  id: DeckLengthId;
  name: string;
  label: string;
  summary: string;
  min: number;
  max: number;
  /** Highest section tier included (1 = core narrative only). */
  tier: 1 | 2 | 3;
}

export const DECK_LENGTHS: Record<DeckLengthId, DeckLength> = {
  quick: {
    id: "quick",
    name: "Quick Pitch",
    label: "8–10 slides",
    summary: "The core narrative only — problem, solution, market, ask.",
    min: 8,
    max: 10,
    tier: 1,
  },
  standard: {
    id: "standard",
    name: "Standard Pitch",
    label: "12–15 slides",
    summary: "The full investor arc with product, technology and roadmap.",
    min: 12,
    max: 15,
    tier: 2,
  },
  deep: {
    id: "deep",
    name: "Deep Dive",
    label: "16–20 slides",
    summary: "Everything, including landscape, go-to-market and the investor lens.",
    min: 16,
    max: 20,
    tier: 3,
  },
};

export const DECK_LENGTH_LIST = deckLengthIds.map((id) => DECK_LENGTHS[id]);

export function getDeckLength(id: string | undefined): DeckLength {
  return DECK_LENGTHS[(id as DeckLengthId) ?? "standard"] ?? DECK_LENGTHS["standard"];
}

/* -------------------------------------------------------- recommendation */

const TECH_SIGNALS = /\b(ai|ml|llm|api|sdk|kubernetes|rust|go|python|infrastructure|observability|data|pipeline|model|agent|protocol|blockchain)\b/i;

export interface StyleRecommendation {
  style: DeckStyleId;
  reason: string;
}

/**
 * Picks a style from evidence that already exists in the analysis — never from
 * invented company facts.
 *
 * @param pitch - The analysed pitch.
 * @returns The recommended style id and the evidence behind it.
 */
export function recommendStyle(pitch: Pitch): StyleRecommendation {
  const techText = [...pitch.technology, pitch.solution, pitch.tagline].join(" ");
  const featureCount = pitch.key_features.length;
  const proseLength = (pitch.problem + pitch.solution + pitch.market_opportunity).length;

  if (pitch.market_data_available) {
    return { style: "data-driven", reason: "Your documentation contains quantitative market evidence." };
  }
  if (pitch.technology.length >= 3 && TECH_SIGNALS.test(techText)) {
    return { style: "dark-tech", reason: "A technical stack and developer-facing product were detected." };
  }
  if (featureCount >= 5) {
    return { style: "modern-startup", reason: "A rich feature set suits card-led product storytelling." };
  }
  if (proseLength > 1200) {
    return { style: "editorial", reason: "Long-form narrative content reads best in an editorial layout." };
  }
  if (proseLength < 400 && featureCount <= 3) {
    return { style: "bold-founder", reason: "Concise source material works best as high-impact statements." };
  }
  return { style: "investor-minimal", reason: "A balanced, evidence-led deck suits a classic investor format." };
}
