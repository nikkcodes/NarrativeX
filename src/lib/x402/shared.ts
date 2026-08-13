/**
 * Client-safe x402 constants and helpers. Nothing here reads secrets.
 */

export type PaymentPhase =
  | "IDLE"
  | "PAYMENT_REQUIRED"
  | "WALLET_CONNECTING"
  | "WALLET_PENDING"
  | "SUBMITTING_PAYMENT"
  | "VERIFYING_PAYMENT"
  | "PAYMENT_SUCCESS"
  | "GENERATING_DECK"
  | "COMPLETE"
  | "ERROR";

export const PAYMENT_PHASE_LABEL: Record<PaymentPhase, string> = {
  IDLE: "Generate Pitch Deck",
  PAYMENT_REQUIRED: "Payment required",
  WALLET_CONNECTING: "Connecting wallet…",
  WALLET_PENDING: "Waiting for wallet approval…",
  SUBMITTING_PAYMENT: "Submitting payment…",
  VERIFYING_PAYMENT: "Verifying payment on Algorand…",
  PAYMENT_SUCCESS: "Payment verified",
  GENERATING_DECK: "Payment confirmed. Building your investor deck…",
  COMPLETE: "Your investor deck is ready.",
  ERROR: "Payment could not be verified.",
};

export const GENERATE_DECK_PATH = "/api/public/generate-deck";
export const X402_STATUS_PATH = "/api/public/x402-status";
export const HEALTH_PATH = "/api/public/health";

/** Public configuration snapshot returned by the diagnostic endpoints. */
export interface X402Status {
  configured: boolean;
  x402Configured: boolean;
  network: string;
  networkId: string;
  algorandTestnetConfigured: boolean;
  price: string;
  asset: string;
  assetId: string;
  paymentAssetConfigured: boolean;
  receiverConfigured: boolean;
  facilitatorConfigured: boolean;
  missing: string[];
}

export function explorerTxUrl(txId: string, networkLabel: string): string {
  const base = networkLabel.toLowerCase().includes("mainnet")
    ? "https://lora.algokit.io/mainnet/transaction"
    : "https://lora.algokit.io/testnet/transaction";
  return `${base}/${txId}`;
}

/** Stable, human-readable messages for the failure modes x402 surfaces. */
export function describePaymentError(reason: string | undefined, fallback: string): string {
  if (!reason) return fallback;
  const r = reason.toLowerCase();
  if (r.includes("insufficient_funds") || r.includes("underfunded") || r.includes("balance"))
    return "Your wallet does not hold enough TestNet USDC (or ALGO for fees) to complete this payment.";
  if (r.includes("network_mismatch") || r.includes("network"))
    return "Your wallet is connected to the wrong Algorand network. Switch to TestNet and try again.";
  if (r.includes("asset")) return "The payment asset did not match TestNet USDC.";
  if (r.includes("receiver")) return "The payment receiver did not match the configured NarrativeX address.";
  if (r.includes("expired") || r.includes("timeout"))
    return "The payment authorization expired before it could be settled. Please try again.";
  if (r.includes("signature") || r.includes("not_signed"))
    return "The payment was not signed. Approve the transaction in your wallet to continue.";
  if (r.includes("opt")) return "The receiving or paying account is not opted in to TestNet USDC.";
  return fallback;
}
