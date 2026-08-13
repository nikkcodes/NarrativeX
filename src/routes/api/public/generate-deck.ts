import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { pitchSchema } from "@/lib/pitch/schema";
import { deckOptionsSchema, type Deck } from "@/lib/deck/schema";

const ROUTE_PATTERN = "POST /api/public/generate-deck";

const bodySchema = z.object({
  pitch: pitchSchema,
  options: deckOptionsSchema.default({ style: "modern-startup", length: "standard" }),
});

/**
 * Payment-protected deck generation.
 *
 * The x402 resource-server middleware runs *before* any deck work: an unpaid
 * request receives a real HTTP 402 with payment requirements, and generation
 * only happens after the facilitator verifies the payment.
 */
export const Route = createFileRoute("/api/public/generate-deck")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, Idempotency-Key",
            "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
          },
        }),

      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ error: "invalid_body", message: "Expected a JSON body." }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            { error: "invalid_body", message: "The pitch payload was malformed or incomplete." },
            { status: 400 },
          );
        }

        const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() || "";

        const { withX402 } = await import("@/lib/x402/resource-server.server");
        const { getCompleted, setCompleted } = await import("@/lib/x402/idempotency.server");

        return withX402(request, {
          routePattern: ROUTE_PATTERN,
          body: parsed.data,
          // A retry of an already-paid generation must not be charged twice.
          skipPayment: () => Boolean(idempotencyKey && getCompleted<Deck>(idempotencyKey)),
          handler: async () => {
            if (idempotencyKey) {
              const existing = getCompleted<Deck>(idempotencyKey);
              if (existing) return { body: { success: true, deck: existing, replayed: true } };
            }

            const { buildDeck } = await import("@/lib/deck/build");
            const deck = buildDeck(parsed.data.pitch, parsed.data.options);
            if (idempotencyKey) setCompleted(idempotencyKey, deck);
            return { body: { success: true, deck } };
          },
        });
      },
    },
  },
});
