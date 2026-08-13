import { useCallback, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExternalLink,
  FileCode2,
  Presentation,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Chip, Panel, StateCard, StatusDot } from "@/components/primitives";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SourceComposer } from "@/components/source-composer";
import { AnalysisProgress } from "@/components/analysis-progress";
import { PitchIntelligence } from "@/components/pitch-intelligence";
import { DeckPreview } from "@/components/deck-preview";
import { DeckConfig } from "@/components/deck-config";
import { AlgorandWalletProvider } from "@/components/wallet-provider";
import { PaymentPanel } from "@/components/payment-panel";
import { Button } from "@/components/ui/button";
import { analyzeReadmeFn } from "@/lib/pitch/analyze.functions";
import {
  payAndGenerateDeck,
  requestDeckQuote,
  type PaymentQuote,
  type PaymentSettlement,
} from "@/lib/x402/client";
import { explorerTxUrl, PAYMENT_PHASE_LABEL, type PaymentPhase } from "@/lib/x402/shared";
import type { ClientAvmSigner } from "@x402/avm";
import type { Pitch } from "@/lib/pitch/schema";
import type { Deck, DeckOptions } from "@/lib/deck/schema";
import { getDeckLength, getDeckStyle, recommendStyle, type DeckLengthId, type DeckStyleId } from "@/lib/deck/styles";
import type { PitchSource } from "@/lib/pitch/types";

const ANALYZE_STAGES = [
  "Reading your project…",
  "Finding the problem…",
  "Extracting the evidence…",
  "Structuring your pitch…",
] as const;

const PAYMENT_STAGES = [
  "Requesting the deck",
  "Awaiting wallet approval",
  "Settling payment on Algorand",
  "Building your investor deck",
  "Ready to present",
] as const;

const PHASE_STAGE: Partial<Record<PaymentPhase, number>> = {
  PAYMENT_REQUIRED: 0,
  WALLET_CONNECTING: 0,
  WALLET_PENDING: 1,
  SUBMITTING_PAYMENT: 2,
  VERIFYING_PAYMENT: 2,
  PAYMENT_SUCCESS: 3,
  GENERATING_DECK: 3,
  COMPLETE: 4,
};

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Turn a README into a pitch deck | NarrativeX" },
      {
        name: "description",
        content:
          "Upload a README or paste documentation, review the extracted pitch, and pay $0.10 USDC on Algorand TestNet to generate a 10-slide investor deck.",
      },
      { property: "og:title", content: "NarrativeX Workspace" },
      {
        property: "og:description",
        content: "Upload a README or paste docs and generate an investor-ready deck.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const analyze = useServerFn(analyzeReadmeFn);
  const [analyzeStage, setAnalyzeStage] = useState(0);

  const [phase, setPhase] = useState<PaymentPhase>("IDLE");
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [settlement, setSettlement] = useState<PaymentSettlement | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [deckStyle, setDeckStyle] = useState<DeckStyleId>("modern-startup");
  const [deckLength, setDeckLength] = useState<DeckLengthId>("standard");
  const [styleTouched, setStyleTouched] = useState(false);
  const idempotencyKey = useRef<string>("");

  const resetPayment = useCallback(() => {
    setPhase("IDLE");
    setQuote(null);
    setSettlement(null);
    setPayError(null);
    setDeck(null);
  }, []);

  const analysis = useMutation<Pitch, Error, PitchSource>({
    mutationFn: async (source) => {
      setAnalyzeStage(0);
      const tick = setInterval(
        () => setAnalyzeStage((s) => Math.min(s + 1, ANALYZE_STAGES.length - 2)),
        2400,
      );
      try {
        const result = await analyze({ data: { content: source.content } });
        if (!result.success) throw new Error(result.error);
        setAnalyzeStage(ANALYZE_STAGES.length - 1);
        if (!styleTouched) setDeckStyle(recommendStyle(result.pitch).style);
        return result.pitch;
      } finally {
        clearInterval(tick);
      }
    },
    onError: (error) => toast.error(error.message || "Analysis failed."),
  });

  const deckOptions: DeckOptions = { style: deckStyle, length: deckLength };
  const recommendation = analysis.data
    ? recommendStyle(analysis.data)
    : { style: "modern-startup" as DeckStyleId, reason: "Choose the presentation format for your deck." };

  /** Step 1 of the paid flow: ask the server for the deck and expect HTTP 402. */
  const startGeneration = async (pitch: Pitch) => {
    setRequesting(true);
    setPayError(null);
    idempotencyKey.current = crypto.randomUUID();
    try {
      const result = await requestDeckQuote(pitch, idempotencyKey.current, deckOptions);
      if (result.type === "payment_required") {
        setQuote(result.quote);
        setPhase("PAYMENT_REQUIRED");
      } else if (result.type === "deck") {
        setDeck(result.deck);
        setPhase("COMPLETE");
      } else {
        setPhase("ERROR");
        setPayError(result.message);
        toast.error(result.message);
      }
    } catch {
      setPhase("ERROR");
      setPayError("Could not reach the deck service. Please try again.");
    } finally {
      setRequesting(false);
    }
  };

  /** Step 2: sign and settle the x402 invoice, then receive the deck. */
  const pay = async (signer: ClientAvmSigner) => {
    if (!analysis.data || !quote) return;
    setPayError(null);
    const result = await payAndGenerateDeck({
      pitch: analysis.data,
      options: deckOptions,
      quote,
      idempotencyKey: idempotencyKey.current,
      signer,
      onPhase: setPhase,
    });


    if (result.type === "error") {
      setPhase("ERROR");
      setPayError(result.message);
      toast.error(result.message);
      return;
    }

    setSettlement(result.settlement);
    setPhase("GENERATING_DECK");
    setDeck(result.deck);
    setPhase("COMPLETE");
    toast.success("Payment verified — your deck is ready.");
  };

  const showDeck = deck !== null;
  const paying = ["WALLET_PENDING", "SUBMITTING_PAYMENT", "VERIFYING_PAYMENT"].includes(phase);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
        {/* Hero */}
        <section className="animate-rise">
          <Chip tone="ember" dot>
            Step 01 — Source
          </Chip>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] sm:text-5xl">
            Turn your README into an investor-ready pitch.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            NarrativeX analyzes your existing product evidence and transforms it into a structured
            investor narrative — without inventing traction or claims.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {TRUST_ROW.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 bg-card px-4 py-3">
                <item.icon className="size-3.5 shrink-0 text-ember" aria-hidden="true" />
                <span className="truncate font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 animate-rise" style={{ animationDelay: "80ms" }}>
          <SourceComposer
            onGenerate={(source) => {
              resetPayment();
              analysis.mutate(source);
            }}
            pending={analysis.isPending}
          />
        </div>

        {analysis.isPending && (
          <div className="mt-10">
            <AnalysisProgress stage={analyzeStage} stages={ANALYZE_STAGES} label="Analysing" />
          </div>
        )}

        {analysis.isError && !analysis.isPending && (
          <div className="mt-10">
            <StateCard
              kind="error"
              title="Analysis failed"
              what={analysis.error?.message || "Your documentation could not be analysed."}
              next="Check the content length and try again, or paste a more complete README."
            />
          </div>
        )}

        {(requesting || paying) && (
          <div className="mt-10">
            <AnalysisProgress
              stage={PHASE_STAGE[phase] ?? 0}
              stages={PAYMENT_STAGES}
              label={PAYMENT_PHASE_LABEL[phase]}
            />
          </div>
        )}

        {showDeck && (
          <div className="mt-14 space-y-6">
            <Panel className="overflow-hidden border-chart-3/30 animate-rise">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <StatusDot tone="positive" />
                  <span className="rule-label">Deck ready</span>
                </div>
                <Chip tone="positive">Generated</Chip>
              </div>
              <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="font-display text-3xl">Your investor-ready pitch has been forged.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Download it below, or start a new generation from the same documentation.
                  </p>
                </div>
                <Button variant="quiet" className="min-h-11 w-full lg:w-auto" onClick={resetPayment}>
                  <RotateCcw className="size-4" />
                  Generate another deck
                </Button>
              </div>
              {settlement && (
                <div className="grid gap-3 border-t border-border px-6 py-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <span className="rule-label">Payment settled — {settlement.network}</span>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {settlement.transactionId}
                    </p>
                  </div>
                  <a
                    className="flex items-center gap-2 font-mono text-xs text-ember underline underline-offset-4"
                    href={explorerTxUrl(settlement.transactionId, settlement.network)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Algorand Explorer
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </Panel>

            <DeckPreview deck={deck} onRestyle={resetPayment} />
          </div>
        )}

        {analysis.isSuccess && !analysis.isPending && !showDeck && (
          <>
            <div className="mt-14">
              <PitchIntelligence pitch={analysis.data} />
            </div>

            <div className="mt-10">
              <DeckConfig
                style={deckStyle}
                length={deckLength}
                recommended={recommendation.style}
                recommendationReason={recommendation.reason}
                disabled={requesting || quote !== null}
                onStyleChange={(next) => {
                  setStyleTouched(true);
                  setDeckStyle(next);
                }}
                onLengthChange={setDeckLength}
              />
            </div>

            {quote ? (
              <div className="mt-8">
                <ClientOnly fallback={null}>
                  <AlgorandWalletProvider>
                    <PaymentPanel
                      quote={quote}
                      phase={phase}
                      error={payError}
                      settlement={settlement}
                      onPay={(signer) => void pay(signer)}
                      onPhase={setPhase}
                    />
                  </AlgorandWalletProvider>
                </ClientOnly>
              </div>
            ) : (
              <Panel className="mt-8 grid gap-5 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <span className="rule-label">Step 03 — Generate</span>
                  <p className="mt-2 font-display text-2xl sm:text-3xl">Ready to forge the deck.</p>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {getDeckLength(deckLength).label} in the {getDeckStyle(deckStyle).name} style,
                    built from the evidence above — nothing invented. Payment is requested by the
                    server before anything is generated.
                  </p>
                </div>
                <Button
                  variant="ink"
                  size="xl"
                  className="min-h-12 w-full lg:w-auto"
                  disabled={requesting}
                  onClick={() => void startGeneration(analysis.data)}
                >
                  <Sparkles className="size-4" />
                  {requesting ? "Preparing…" : "Generate Pitch Deck"}
                </Button>
                {payError && (
                  <div className="lg:col-span-2">
                    <StateCard
                      kind="error"
                      title="Request failed"
                      what={payError}
                      next="Retry the request. If it persists, the payment service may be temporarily unavailable."
                    />
                  </div>
                )}
              </Panel>
            )}
          </>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6">
          <span className="rule-label">Pay-per-generation • x402 • Algorand TestNet</span>
          <span className="text-xs text-muted-foreground">
            No account required. You pay only when a deck is produced.
          </span>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

const TRUST_ROW = [
  { label: "README evidence", icon: FileCode2 },
  { label: "AI analysis", icon: Sparkles },
  { label: "Investor narrative", icon: Presentation },
  { label: "x402 payment", icon: ShieldCheck },
] as const;

