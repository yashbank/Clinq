import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-4xl rounded-2xl border border-clinq-glass-border bg-gradient-to-br from-primary/12 via-background/90 to-accent/8 p-8 text-center shadow-lg sm:rounded-3xl sm:p-12 sm:backdrop-blur-sm">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Ready for a calmer, sharper freelance practice?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Clinq is assistant-first: you approve every outbound. No scrapers, no spam engines.
        </p>
        <Button size="lg" className="mt-8 bg-gradient-to-r from-primary to-accent text-primary-foreground" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </section>
  );
}
