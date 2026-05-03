import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative px-6 pb-24 pt-20 md:pt-28">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-clinq-glass-border bg-clinq-glass/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI operating system for elite freelancers
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
          Stop wasting bids.{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-clinq-success bg-clip-text text-transparent">
            Win serious clients.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Clinq scores leads, drafts proposals, tracks your pipeline, and nudges follow-ups—
          without spam or shady automation.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-12 gap-2 bg-gradient-to-r from-primary to-accent px-8 text-primary-foreground"
            asChild
          >
            <Link href="/dashboard">
              Enter command center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 border-clinq-glass-border bg-transparent" asChild>
            <a href="#features">See capabilities</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
