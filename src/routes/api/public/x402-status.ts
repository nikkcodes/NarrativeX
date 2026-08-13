import { createFileRoute } from "@tanstack/react-router";

/**
 * x402 configuration diagnostics. Never performs a payment and never exposes
 * secret values — only presence flags and public protocol parameters.
 */
export const Route = createFileRoute("/api/public/x402-status")({
  server: {
    handlers: {
      GET: async () => {
        const { readX402Config, toPublicStatus } = await import("@/lib/x402/config.server");
        return Response.json(toPublicStatus(readX402Config()), {
          headers: { "cache-control": "no-store" },
        });
      },
    },
  },
});
