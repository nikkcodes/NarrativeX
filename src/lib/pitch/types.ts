/**
 * Shared domain types for PitchForge.
 *
 * These are the contracts the future backend will fill in:
 *  - OpenAI generation  -> DeckGenerationResult
 *  - x402 / Algorand    -> PaymentIntent
 *  - PPTX / PDF export  -> ExportFormat
 */

export type SourceKind = "file" | "paste";

export interface PitchSource {
  kind: SourceKind;
  /** Original file name when kind === "file". */
  fileName?: string;
  /** Raw README / documentation text. */
  content: string;
  /** Byte size of the uploaded file, when known. */
  sizeBytes?: number;
}

export interface DeckSlide {
  id: string;
  title: string;
  bullets: string[];
  speakerNotes?: string;
}

export interface DeckGenerationResult {
  id: string;
  createdAt: string;
  slides: DeckSlide[];
}

export type ExportFormat = "pptx" | "pdf";

export interface PaymentIntent {
  /** x402 payment challenge, settled on Algorand. */
  scheme: "x402";
  network: "algorand";
  amount: string;
  asset: string;
  status: "required" | "settled" | "failed";
}

export const SOURCE_LIMITS = {
  maxChars: 60_000,
  minChars: 200,
  acceptedExtensions: [".md", ".markdown", ".txt", ".mdx", ".rst"],
} as const;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
