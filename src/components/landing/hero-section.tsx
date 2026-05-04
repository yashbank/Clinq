import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VideoWithFallback } from "@/components/layout/video-with-fallback";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[28rem] overflow-hidden px-6 pb-24 pt-20 md:min-h-[32rem] md:pt-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <VideoWithFallback
          videoSrc="/background/bg-video.mp4"
          poster="/background/bg-image.png"
          fallbackImageSrc="/background/bg-image.png"
          videoClassName="opacity-45 md:opacity-50"
        />
        <div className="absolute inset-0 bg-background/55 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/35 to-background/95" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-clinq-glass-border bg-clinq-glass/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI operating system for elite freelancers
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground drop-shadow-sm md:text-6xl md:leading-[1.05]">
          Stop wasting bids.{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-clinq-success bg-clip-text text-transparent">
            Win serious clients.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground drop-shadow-sm">
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
          <Button size="lg" variant="outline" className="h-12 border-clinq-glass-border bg-background/40 backdrop-blur-sm" asChild>
            <a href="#features">See capabilities</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
