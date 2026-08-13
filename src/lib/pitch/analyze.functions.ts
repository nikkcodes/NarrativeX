import { createServerFn } from "@tanstack/react-start";
import { analyzeInputSchema } from "@/lib/pitch/schema";
import type { AnalyzeResult } from "@/lib/pitch/schema";

export const analyzeReadmeFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analyzeInputSchema.parse(input))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const { analyzeReadme } = await import("@/lib/pitch/analyze.server");
    return analyzeReadme(data);
  });
