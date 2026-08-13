import { createFileRoute } from "@tanstack/react-router";

/**
 * Deployment health + configuration check. Reports only whether values are
 * present — never the values themselves.
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const { readX402Config, toPublicStatus } = await import("@/lib/x402/config.server");
        const status = toPublicStatus(readX402Config());
        return Response.json(
          {
            status: "ok",
            service: "PitchForge",
            aiConfigured: Boolean(process.env["LOVABLE_API_KEY"] || process.env["OPENAI_API_KEY"]),
            x402Configured: status.configured,
            algorandNetwork: status.network,
            algorandTestnetConfigured: status.algorandTestnetConfigured,
            paymentAssetConfigured: status.paymentAssetConfigured,
            receiverConfigured: status.receiverConfigured,
            facilitatorConfigured: status.facilitatorConfigured,
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
