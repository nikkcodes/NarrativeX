import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { ExternalLink, Loader2, Lock, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, Eyebrow, Panel, StateCard, StatusDot, shortAddress } from "@/components/primitives";
import { explorerTxUrl, PAYMENT_PHASE_LABEL, type PaymentPhase } from "@/lib/x402/shared";
import type { PaymentQuote, PaymentSettlement } from "@/lib/x402/client";
import type { ClientAvmSigner } from "@x402/avm";

const BUSY: PaymentPhase[] = [
  "WALLET_CONNECTING",
  "WALLET_PENDING",
  "SUBMITTING_PAYMENT",
  "VERIFYING_PAYMENT",
];

interface PaymentPanelProps {
  quote: PaymentQuote;
  phase: PaymentPhase;
  error: string | null;
  settlement: PaymentSettlement | null;
  onPay: (signer: ClientAvmSigner) => void;
  onPhase: (phase: PaymentPhase) => void;
}

/**
 * x402 payment step: connect an Algorand wallet, then pay the real invoice.
 *
 * @param props - Quote, current phase, error/settlement state and callbacks.
 * @returns The payment panel.
 */
export function PaymentPanel({
  quote,
  phase,
  error,
  settlement,
  onPay,
  onPhase,
}: PaymentPanelProps) {
  const { wallets, activeAddress, activeWallet, signTransactions } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const busy = BUSY.includes(phase);
  const sameAccount = Boolean(activeAddress) && activeAddress === quote.payTo;

  const handleConnect = async (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return;
    setConnecting(walletId);
    onPhase("WALLET_CONNECTING");
    try {
      await wallet.connect();
      onPhase("PAYMENT_REQUIRED");
    } catch {
      onPhase("PAYMENT_REQUIRED");
    } finally {
      setConnecting(null);
    }
  };

  const handlePay = () => {
    if (!activeAddress) return;
    onPay({
      address: activeAddress,
      signTransactions: (txns, indexes) => signTransactions(txns, indexes),
    });
  };

  return (
    <Panel className="overflow-hidden border-ember/30 shadow-lift animate-rise">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Lock className="size-3.5 text-ember" />
          <Eyebrow>Payment required</Eyebrow>
        </div>
        <Chip tone="ember">x402</Chip>
      </div>

      {/* Amount + terms */}
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="pointer-events-none absolute inset-0 micro-grid [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_60%)]" />
        <div className="relative">
          <p className="font-display text-5xl leading-none sm:text-6xl">{quote.amountLabel}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            One payment. One investor-ready deck. Your deck is released only after the payment is
            verified on-chain.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip>{quote.networkLabel}</Chip>
            <Chip>USDC</Chip>
            <Chip>Exact payment</Chip>
          </div>
        </div>

        <dl className="relative space-y-3 self-start rounded-xl border border-border bg-surface/70 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="rule-label">Receiver</dt>
            <dd className="truncate font-mono text-xs" title={quote.payTo}>
              {shortAddress(quote.payTo)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="rule-label">Scheme</dt>
            <dd className="font-mono text-xs">exact · USDC</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="rule-label">Network</dt>
            <dd className="truncate font-mono text-xs">{quote.networkLabel}</dd>
          </div>
        </dl>
      </div>

      {/* Wallet state */}
      <div className="border-t border-border px-6 py-6 sm:px-8">
        {!activeAddress ? (
          <div>
            <div className="flex items-center gap-2">
              <StatusDot tone="neutral" />
              <span className="text-sm font-medium">Connect Pera Wallet</span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Connect Pera to continue. You need TestNet USDC (asset 10458941) and a small amount of
              ALGO for fees.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {wallets.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="quiet"
                  disabled={connecting !== null}
                  className="min-h-11"
                  onClick={() => handleConnect(wallet.id)}
                >
                  {connecting === wallet.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Wallet className="size-4" />
                  )}
                  {wallet.metadata.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot tone={sameAccount ? "warning" : "positive"} pulse={busy} />
                <span className="truncate text-sm font-medium">
                  {activeWallet?.metadata.name ?? "Wallet"} connected
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={activeAddress}>
                {shortAddress(activeAddress)}
              </p>
              <button
                type="button"
                className="mt-1.5 rounded font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                onClick={() => activeWallet?.disconnect()}
              >
                Disconnect
              </button>
            </div>

            <Button
              variant="ink"
              size="xl"
              disabled={busy}
              className="w-full min-h-12 lg:w-auto"
              onClick={handlePay}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {busy ? PAYMENT_PHASE_LABEL[phase] : `Pay ${quote.amountLabel} & Generate Deck`}
            </Button>
          </div>
        )}

        {sameAccount && (
          <div className="mt-5">
            <StateCard
              kind="warning"
              title="Different wallet required"
              what="The connected account is the same as the payment receiver."
              next="Connect your NarrativeX Player account to continue."
            />
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 pb-6 sm:px-8">
          <StateCard
            kind="error"
            title="Payment failed"
            what={error}
            next="Check your connected Pera wallet balance and network, then try again."
          />
        </div>
      )}

      {settlement && (
        <div className="px-6 pb-6 sm:px-8">
          <div className="rounded-xl border border-chart-3/35 bg-chart-3/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <StatusDot tone="positive" />
              <span className="rule-label">Payment settled</span>
            </div>
            <a
              className="mt-2 flex items-center gap-2 break-all font-mono text-xs text-ember underline underline-offset-4"
              href={explorerTxUrl(settlement.transactionId, settlement.network)}
              target="_blank"
              rel="noreferrer"
            >
              {settlement.transactionId}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        </div>
      )}

      {/* Trust footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface/60 px-6 py-3.5 sm:px-8">
        <ShieldCheck className="hidden size-3 text-muted-foreground sm:block" aria-hidden="true" />
        <span className="rule-label">Secured by x402 • Settled on Algorand</span>
      </div>
    </Panel>
  );
}
