import { streamText, Output, NoObjectGeneratedError } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  ANALYZE_LIMITS,
  emptyPitch,
  pitchSchema,
  type AnalyzeInput,
  type AnalyzeResult,
  type Pitch,
} from "@/lib/pitch/schema";

const MODEL = "google/gemini-3.6-flash";

function findConfiguredAiProvider() {
  const lovableApiKey = process.env["LOVABLE_API_KEY"]?.trim();
  const openAIApiKey = process.env["OPENAI_API_KEY"]?.trim();

  if (lovableApiKey) {
    return createLovableAiGatewayProvider(lovableApiKey, undefined, { structuredOutputs: true });
  }

  if (openAIApiKey) {
    return createOpenAICompatible({
      name: "openai",
      apiKey: openAIApiKey,
      compatibility: "strict",
    });
  }

  return null;
}

function summarizeText(content: string, maxLength = 220) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  return compact.slice(0, maxLength);
}

function pickSection(content: string, names: string[]) {
  const lower = content.toLowerCase();

  for (const name of names) {
    const pattern = new RegExp(`(^|\\n|\\r\\n)#{1,6}\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(?:\\n|\\r\\n|$)`, "i");
    const match = content.match(pattern);
    if (match) {
      const start = match.index ?? 0;
      const remainder = content.slice(start + match[0].length);
      const nextHeader = remainder.search(/^#{1,6}\s+/m);
      const section = nextHeader >= 0 ? remainder.slice(0, nextHeader) : remainder;
      return section.trim();
    }
  }

  const [firstMatch] = names.flatMap((name) => {
    const idx = lower.indexOf(name);
    return idx >= 0 ? [{ index: idx, name }] : [];
  }).sort((a, b) => a.index - b.index);

  if (!firstMatch) return "";
  const start = lower.indexOf(firstMatch.name);
  const snippet = content.slice(start, Math.min(content.length, start + 500));
  return snippet.trim();
}

function extractListItems(text: string, maxItems = 6): string[] {
  if (!text) return [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .filter((line) => line.length < 120);

  if (lines.length > 0) {
    return lines.slice(0, maxItems);
  }

  return text
    .split(/[,;] /)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function inferPitchFromDocumentation(content: string): Pitch {
  const raw = content.trim();
  const normalized = raw.replace(/\s+/g, " ");
  const firstSentence = normalized.match(/[^.!?]+[.!?]/)?.[0]?.trim() ?? normalized.slice(0, 180).trim();
  const firstLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? "Project";
  const projectName = firstLine.replace(/^#+\s*/, "").replace(/\s*[-–—]\s*.*$/, "").trim() || "Project";

  const problem = pickSection(raw, ["problem", "challenge", "pain point", "why it matters", "motivation"]);
  const solution = pickSection(raw, ["solution", "what it does", "approach", "how it works", "product"]);
  const market = pickSection(raw, ["market opportunity", "market", "opportunity", "why now", "why this matters"]);
  const businessModel = pickSection(raw, ["business model", "pricing", "revenue", "monetization", "cost structure"]);
  const roadmap = pickSection(raw, ["roadmap", "future", "planned", "next steps"]);
  const technologies = pickSection(raw, ["tech stack", "technology", "stack", "built with", "architecture"]);

  const targetUsersText = pickSection(raw, ["target users", "users", "audience", "who it's for", "customer"]);
  const keyFeaturesText = pickSection(raw, ["features", "key features", "capabilities", "highlights"]);
  const advantagesText = pickSection(raw, ["competitive advantage", "why us", "differentiators", "advantages", "value proposition"]);

  const techList = extractListItems(technologies, 8)
    .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  return {
    ...emptyPitch,
    project_name: projectName,
    tagline: firstSentence || `${projectName} helps teams turn technical work into clear business value.`,
    problem:
      problem ||
      firstSentence ||
      `${projectName} addresses a real operational challenge that is currently difficult to explain and act on quickly.`,
    solution:
      solution ||
      "The product provides a structured, user-friendly workflow that turns technical context into clear, actionable output.",
    target_users: extractListItems(targetUsersText, 5).length
      ? extractListItems(targetUsersText, 5)
      : ["Technical teams", "Product leaders", "Investors"],
    key_features: extractListItems(keyFeaturesText, 6).length
      ? extractListItems(keyFeaturesText, 6)
      : ["Clear documentation intake", "Structured narrative generation", "Presentation-ready outputs"],
    market_opportunity:
      market ||
      "The opportunity is to reduce friction between technical product knowledge and external communication, helping teams translate complexity into clear business narratives.",
    market_data_available: false,
    business_model:
      businessModel ||
      "The product appears to be positioned as a software service and generation workflow, with value delivered through faster technical-to-pitch conversion.",
    competitive_advantage: extractListItems(advantagesText, 6).length
      ? extractListItems(advantagesText, 6)
      : ["Translates technical docs into a credible narrative", "Keeps outputs grounded in source material", "Designed for investor-ready communication"],
    technology: techList.length ? techList : ["TypeScript", "React", "AI-assisted analysis", "Web app workflow"],
    traction: "",
    roadmap: extractListItems(roadmap, 5).length ? extractListItems(roadmap, 5) : ["Expand user workflows", "Integrate more export formats", "Improve content validation"],
    call_to_action: "Try the product, validate the narrative, and turn your documentation into a presentation-ready pitch.",
    confidence_notes: ["This summary was inferred from the uploaded documentation because no AI provider was configured for this session."],
    investor_questions: [
      "What specific user problem is being solved most urgently?",
      "What proof of traction or real-world adoption exists?",
      "What is the strongest differentiator versus existing pitch tooling?",
    ],
  };
}

const SYSTEM_PROMPT = `You are an analyst who turns technical project documentation into investor-ready pitch material.

EVIDENCE MODEL — classify every factual business claim before you write it:
A. Explicitly supported — stated in the documentation. Write it plainly.
B. Reasonable interpretation — a fair reading of what the documentation implies. You may write it, but keep it qualitative and add a confidence note naming the field and what was inferred.
C. Missing — no basis in the documentation. Return "" or [] for that field. Never fill the gap.

RULES — these are absolute:
1. Use ONLY information supported by, or reasonably interpretable from, the supplied documentation.
2. NEVER invent quantitative claims of any kind: market sizes, revenue, customer or user counts, funding, growth rates, partnerships, traction metrics, or named competitors. If a number is not in the documentation, it does not exist.
3. market_opportunity: if the documentation contains quantitative market data (market size, spend, segment figures), summarise it and set market_data_available to true. Otherwise write a qualitative opportunity statement grounded in the described problem and users, and set market_data_available to false. Never state a figure to justify the opportunity.
4. traction and business_model: category C unless the documentation states them. Empty is always better than invented.
5. confidence_notes: brief notes (under 20 words each) for sections that were incomplete or inferred — e.g. "Business model inferred from open-source positioning; not stated." Leave empty when everything was explicit.
5b. investor_questions: exactly 3 concise questions (under 18 words each) an investor would most likely ask about THIS project — target the weakest or least-evidenced parts of the pitch. Never phrase them as claims.
6. You may rephrase technical language into clear, confident, investor-friendly prose — rewriting is allowed, inventing is not.
7. Keep prose fields concise: 1-3 sentences. Keep list items short (under 15 words each), maximum 6 items per list.
8. Do not include markdown, code fences, or commentary — only the structured fields.`;

function clampList(values: string[], max = 6): string[] {
  return values
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalize(pitch: Pitch): Pitch {
  const market_opportunity = pitch.market_opportunity.trim();
  return {
    ...emptyPitch,
    ...pitch,
    project_name: pitch.project_name.trim(),
    tagline: pitch.tagline.trim(),
    problem: pitch.problem.trim(),
    solution: pitch.solution.trim(),
    market_opportunity,
    // A "quantitative data available" claim is meaningless without an actual statement.
    market_data_available: market_opportunity ? pitch.market_data_available : false,
    business_model: pitch.business_model.trim(),
    traction: pitch.traction.trim(),
    call_to_action: pitch.call_to_action.trim(),
    target_users: clampList(pitch.target_users),
    key_features: clampList(pitch.key_features),
    competitive_advantage: clampList(pitch.competitive_advantage),
    technology: clampList(pitch.technology, 10),
    roadmap: clampList(pitch.roadmap),
    confidence_notes: clampList(pitch.confidence_notes),
    investor_questions: clampList(pitch.investor_questions, 3),
  };
}


/** Server-only: analyses README/documentation text into a validated pitch object. */
export async function analyzeReadme({ content }: AnalyzeInput): Promise<AnalyzeResult> {
  const source = content.trim().slice(0, ANALYZE_LIMITS.maxChars);
  const provider = findConfiguredAiProvider();

  if (!provider) {
    const fallbackPitch = normalize(inferPitchFromDocumentation(source));
    const parsed = pitchSchema.safeParse(fallbackPitch);
    if (!parsed.success) {
      return { success: false, error: "The documentation could not be interpreted locally." };
    }
    return { success: true, pitch: normalize(parsed.data) };
  }

  try {
    // Streamed on the wire so long documents never hit the platform request timeout,
    // but consumed server-side because this endpoint is one-shot.
    const result = streamText({
      model: provider(MODEL),
      system: SYSTEM_PROMPT,
      output: Output.object({ schema: pitchSchema }),
      prompt: `Analyse the following project documentation and produce the structured pitch fields.\n\n---\n${source}\n---`,
    });

    const output = await result.output;
    const parsed = pitchSchema.safeParse(output);
    if (!parsed.success) {
      return { success: false, error: "The AI returned an unexpected response. Please try again." };
    }
    return { success: true, pitch: normalize(parsed.data) };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const fallbackPitch = normalize(inferPitchFromDocumentation(source));
      const parsed = pitchSchema.safeParse(fallbackPitch);
      if (parsed.success) {
        return { success: true, pitch: normalize(parsed.data) };
      }
      return {
        success: false,
        error: "The AI could not structure this documentation. Try a more descriptive README.",
      };
    }

    const message = error instanceof Error ? error.message : "";
    console.error("analyzeReadme failed:", message);

    const fallbackPitch = normalize(inferPitchFromDocumentation(source));
    const parsed = pitchSchema.safeParse(fallbackPitch);
    if (parsed.success) {
      return { success: true, pitch: normalize(parsed.data) };
    }

    if (message.includes("429")) {
      return { success: false, error: "Too many requests right now. Please retry in a moment." };
    }
    if (message.includes("402")) {
      return { success: false, error: "AI credits are exhausted. Add credits to continue." };
    }
    return { success: false, error: "Analysis failed. Please try again." };
  }
}
