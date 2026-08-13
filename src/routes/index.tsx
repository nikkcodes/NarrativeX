import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCode2, Presentation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Chip, Panel } from "@/components/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NarrativeX — Turn your README into an investor pitch deck" },
      {
        name: "description",
        content:
          "NarrativeX converts READMEs and technical documentation into investor-ready pitch decks. Pay per generation with x402 on Algorand.",
      },
      { property: "og:title", content: "NarrativeX — Your README is technical. Your pitch shouldn't be." },
      {
        property: "og:description",
        content: "Transform technical documentation into investor-ready presentations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 paper-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div className="animate-rise">
              <Chip tone="ember" dot>
                Documentation → Narrative
              </Chip>
              <h1 className="mt-6 text-5xl leading-[1.04] sm:text-6xl">
                Your README is technical.
                <br />
                <span className="italic text-ember">Your pitch shouldn't be.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                NarrativeX reads your README, docs, or technical description and rewrites it as an
                investor-ready presentation — problem, market, product, traction — in the language
                capital understands.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild variant="ink" size="xl" className="min-h-12">
                  <Link to="/workspace">
                    Generate Pitch Deck <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="quiet" size="xl" className="min-h-12">
                  <Link to="/workspace">Upload README or paste docs</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Chip>x402</Chip>
                <Chip>Algorand TestNet</Chip>
                <Chip>0.10 USDC per deck</Chip>
              </div>
            </div>

            <div className="animate-fade" style={{ animationDelay: "120ms" }}>
              <DeckPreview />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Panel key={step.title} interactive className="p-6">
                <div className="flex items-center gap-3">
                  <step.icon className="size-4 text-ember" />
                  <span className="rule-label">Step {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="mt-4 text-2xl">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </Panel>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}


const STEPS = [
  {
    icon: FileCode2,
    title: "Give it the source",
    body: "Drop a README file or paste raw documentation. No setup, no account, no configuration.",
  },
  {
    icon: Sparkles,
    title: "It finds the story",
    body: "Architecture notes become a product narrative. Feature lists become differentiation.",
  },
  {
    icon: Presentation,
    title: "Leave with a deck",
    body: "A structured, investor-legible presentation ready to export and take into the room.",
  },
];

function DeckPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-x-4 top-8 bottom-0 rotate-[1.5deg] rounded-xl border border-border bg-surface" />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lift">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-2 rounded-full bg-ember" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="ml-2 rule-label">deck.pptx</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border">
          {SLIDES.map((slide) => (
            <div key={slide.label} className="bg-card p-5">
              <span className="rule-label">{slide.label}</span>
              <p className="mt-2 font-display text-lg leading-snug">{slide.title}</p>
              <div className="mt-3 space-y-1.5">
                {slide.lines.map((w, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full bg-surface-strong"
                    style={{ width: w }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-4">
          <p className="font-mono text-[0.7rem] text-muted-foreground">
            ## Installation → <span className="text-ember">Go-to-market</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  { label: "01", title: "The problem", lines: ["90%", "70%", "80%"] },
  { label: "02", title: "The product", lines: ["75%", "88%", "60%"] },
  { label: "03", title: "Market", lines: ["65%", "82%", "72%"] },
  { label: "04", title: "Why now", lines: ["85%", "58%", "78%"] },
];
