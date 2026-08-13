import { z } from "zod";

/**
 * Strict investor-pitch contract. Every field is required in the response;
 * missing evidence in the source is represented as "" or [] — never invented.
 */
export const pitchSchema = z.object({
  project_name: z.string(),
  tagline: z.string(),
  problem: z.string(),
  solution: z.string(),
  target_users: z.array(z.string()),
  key_features: z.array(z.string()),
  market_opportunity: z.string(),
  /** True only when the documentation itself contains quantitative market data. */
  market_data_available: z.boolean(),
  business_model: z.string(),
  competitive_advantage: z.array(z.string()),
  technology: z.array(z.string()),
  traction: z.string(),
  roadmap: z.array(z.string()),
  call_to_action: z.string(),
  /** Short notes on sections that were incomplete or inferred rather than stated. */
  confidence_notes: z.array(z.string()),
  /** Three concise questions an investor would likely ask about this project. */
  investor_questions: z.array(z.string()),
});

export type Pitch = z.infer<typeof pitchSchema>;

export const emptyPitch: Pitch = {
  project_name: "",
  tagline: "",
  problem: "",
  solution: "",
  target_users: [],
  key_features: [],
  market_opportunity: "",
  market_data_available: false,
  business_model: "",
  competitive_advantage: [],
  technology: [],
  traction: "",
  roadmap: [],
  call_to_action: "",
  confidence_notes: [],
  investor_questions: [],
};

export const ANALYZE_LIMITS = {
  minChars: 200,
  maxChars: 60_000,
} as const;

export const analyzeInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(ANALYZE_LIMITS.minChars, "Documentation is too short to analyse.")
    .max(ANALYZE_LIMITS.maxChars, "Documentation exceeds the maximum supported length."),
});

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;

export type AnalyzeResult =
  | { success: true; pitch: Pitch }
  | { success: false; error: string };
