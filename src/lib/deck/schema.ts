import { z } from "zod";
import { deckLengthIds, deckStyleIds } from "@/lib/deck/styles";

/**
 * Deterministic slide model. The AI never produces layout — it produces pitch
 * data, and the application maps that data into these predefined templates.
 */
export const slideLayouts = [
  "cover",
  "divider",
  "statement",
  "split",
  "flow",
  "process",
  "features",
  "market",
  "metrics",
  "matrix",
  "model",
  "architecture",
  "technology",
  "advantage",
  "comparison",
  "timeline",
  "roadmap",
  "quote",
  "questions",
  "gap",
  "closing",
] as const;

export type SlideLayout = (typeof slideLayouts)[number];

export const deckBulletSchema = z.object({
  label: z.string(),
  detail: z.string().default(""),
});

export const deckMetricSchema = z.object({
  value: z.string(),
  label: z.string(),
  detail: z.string().default(""),
});

export const deckColumnSchema = z.object({
  title: z.string(),
  items: z.array(z.string()).default([]),
  highlight: z.boolean().default(false),
});

export const deckPhaseSchema = z.object({
  phase: z.string(),
  label: z.string(),
  detail: z.string().default(""),
});

export const deckSlideSchema = z.object({
  id: z.string(),
  /** 1-based position in the deck. */
  number: z.number(),
  layout: z.enum(slideLayouts),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string().default(""),
  body: z.string().default(""),
  bullets: z.array(deckBulletSchema).default([]),
  steps: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  metrics: z.array(deckMetricSchema).default([]),
  columns: z.array(deckColumnSchema).default([]),
  phases: z.array(deckPhaseSchema).default([]),
  /** Honest disclosure shown when the source documentation lacked evidence. */
  note: z.string().default(""),
  closing: z.string().default(""),
});

export type DeckBullet = z.infer<typeof deckBulletSchema>;
export type DeckMetric = z.infer<typeof deckMetricSchema>;
export type DeckColumn = z.infer<typeof deckColumnSchema>;
export type DeckPhase = z.infer<typeof deckPhaseSchema>;
export type DeckSlide = z.infer<typeof deckSlideSchema>;

export const deckOptionsSchema = z.object({
  style: z.enum(deckStyleIds).default("modern-startup"),
  length: z.enum(deckLengthIds).default("standard"),
});

export type DeckOptions = z.infer<typeof deckOptionsSchema>;

export const deckQualitySchema = z.object({
  /** Sections whose slides are honest placeholders rather than evidence. */
  gaps: z.array(z.string()).default([]),
  /** Sections fully backed by the source documentation. */
  supported: z.array(z.string()).default([]),
  score: z.number().default(0),
});

export type DeckQuality = z.infer<typeof deckQualitySchema>;

export const deckSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  generatedAt: z.string(),
  style: z.enum(deckStyleIds).default("modern-startup"),
  length: z.enum(deckLengthIds).default("standard"),
  quality: deckQualitySchema.default({ gaps: [], supported: [], score: 0 }),
  slides: z.array(deckSlideSchema),
});

export type Deck = z.infer<typeof deckSchema>;

export type GenerateDeckResult =
  | { success: true; deck: Deck }
  | { success: false; error: string };

export const DECK_SIZE = { width: 1280, height: 720 } as const;

export const NO_MARKET_DATA_NOTE = "Market sizing not provided in source documentation.";
