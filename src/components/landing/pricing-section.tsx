import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Solo",
    price: "$29",
    desc: "Command center, scoring, proposals.",
    features: ["Lead table & tags", "AI scoring", "Proposal studio", "Pipeline kanban"],
  },
  {
    name: "Pro",
    price: "$79",
    desc: "Analytics, memory, and team-ready workflows.",
    features: ["Everything in Solo", "Client history memory", "Analytics suite", "Priority AI"],
    highlight: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Simple pricing</h2>
        <p className="mt-3 text-muted-foreground">Placeholder tiers—wire to billing when you launch.</p>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={
              t.highlight
                ? "glass-card-hover relative rounded-2xl border border-primary/40 bg-primary/5 p-8 ai-glow-subtle"
                : "glass-card-hover rounded-2xl border border-clinq-glass-border p-8"
            }
          >
            <h3 className="text-xl font-semibold text-foreground">{t.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            <p className="mt-6 text-4xl font-semibold text-foreground">
              {t.price}
              <span className="text-base font-normal text-muted-foreground">/mo</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-clinq-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full bg-gradient-to-r from-primary to-accent text-primary-foreground" asChild>
              <Link href="/dashboard">Open app</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
