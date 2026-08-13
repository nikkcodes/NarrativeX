import {
  ALGORAND_MAINNET_GENESIS_HASH,
  ALGORAND_TESTNET_GENESIS_HASH,
  USDC_MAINNET_ASA_ID,
  USDC_TESTNET_ASA_ID,
  isValidAlgorandAddress,
} from "@x402/avm";
import type { Network } from "@x402/core/types";

// The facilitator advertises Algorand networks by their full genesis hash
// (`algorand:<genesisHash>`), not the truncated CAIP-2 alias exported as
// ALGORAND_*_CAIP2. The AVM scheme normalises this form, so use it everywhere.
const ALGORAND_MAINNET_NETWORK = `algorand:${ALGORAND_MAINNET_GENESIS_HASH}`;
const ALGORAND_TESTNET_NETWORK = `algorand:${ALGORAND_TESTNET_GENESIS_HASH}`;


/**
 * Server-only x402 configuration. All values come from the environment so the
 * network can move from TestNet to MainNet without a code change. Nothing
 * secret is ever returned to the browser — the diagnostic endpoints only report
 * whether a value is present.
 */
export interface X402Config {
  /** CAIP-2 network identifier from the official SDK constants. */
  network: Network;
  networkLabel: "Algorand TestNet" | "Algorand MainNet";
  /** USDC ASA id from the official SDK constants. */
  asset: string;
  assetLabel: string;
  /** Public Algorand address receiving PitchForge payments. */
  payTo: string;
  facilitatorUrl: string;
  /** Price as a USD money string, e.g. "$0.10". */
  price: string;
  priceValue: string;
  missing: string[];
}

const DEFAULT_PRICE = "0.10";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * Reads x402 configuration from the environment.
 *
 * @returns The resolved configuration plus a list of missing/invalid variables.
 */
export function readX402Config(): X402Config {
  const missing: string[] = [];

  const networkEnv = (env("X402_NETWORK") || env("ALGORAND_NETWORK") || "testnet").trim();
  const normalizedNetwork = networkEnv.toLowerCase();
  const isMainnet =
    normalizedNetwork === "mainnet" ||
    normalizedNetwork === `algorand:${ALGORAND_MAINNET_GENESIS_HASH.toLowerCase()}`;

  const networkValue =
    normalizedNetwork.startsWith("algorand:")
      ? networkEnv
      : `algorand:${isMainnet ? ALGORAND_MAINNET_GENESIS_HASH : ALGORAND_TESTNET_GENESIS_HASH}`;

  const payTo = env("AVM_ADDRESS");
  if (!payTo) missing.push("AVM_ADDRESS");
  else if (!isValidAlgorandAddress(payTo)) missing.push("AVM_ADDRESS (not a valid Algorand address)");

  // GoPlausible's hosted AVM facilitator. This is the only supported host;
  // legacy/unreachable hosts are ignored even if present in the environment.
  const DEFAULT_FACILITATOR = "https://facilitator.goplausible.xyz";
  const facilitatorEnv = env("FACILITATOR_URL");
  const facilitatorUrl =
    facilitatorEnv && /^https:\/\/facilitator\.goplausible\.xyz/i.test(facilitatorEnv)
      ? facilitatorEnv.replace(/\/+$/, "")
      : DEFAULT_FACILITATOR;



  const rawPrice = env("PITCH_DECK_PRICE") || DEFAULT_PRICE;
  const priceValue = Number.parseFloat(rawPrice.replace(/^\$/, ""));
  const safePrice = Number.isFinite(priceValue) && priceValue > 0 ? priceValue : Number(DEFAULT_PRICE);

  return {
    network: networkValue as Network,
    networkLabel: isMainnet ? "Algorand MainNet" : "Algorand TestNet",
    asset: isMainnet ? USDC_MAINNET_ASA_ID : USDC_TESTNET_ASA_ID,
    assetLabel: isMainnet ? "USDC (MainNet)" : "USDC (TestNet)",
    payTo,
    facilitatorUrl,
    price: `$${safePrice.toFixed(2)}`,
    priceValue: safePrice.toFixed(2),
    missing,
  };
}

/**
 * Public, secret-free configuration snapshot for the diagnostic endpoints.
 *
 * @param config - Resolved x402 configuration.
 * @returns A JSON-safe status object with no secret values.
 */
export function toPublicStatus(config: X402Config) {
  const receiverConfigured =
    Boolean(config.payTo) && !config.missing.some((m) => m.startsWith("AVM_ADDRESS"));
  return {
    configured: config.missing.length === 0,
    x402Configured: config.missing.length === 0,
    network: config.networkLabel,
    networkId: config.network,
    algorandTestnetConfigured: config.networkLabel === "Algorand TestNet",
    price: config.price,
    asset: config.assetLabel,
    assetId: config.asset,
    paymentAssetConfigured: Boolean(config.asset),
    receiverConfigured,
    facilitatorConfigured:
      /^https:\/\/facilitator\.goplausible\.xyz/i.test(config.facilitatorUrl),
    missing: config.missing,
  };
}

