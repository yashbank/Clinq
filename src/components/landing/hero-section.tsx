import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VideoWithFallback } from "@/components/layout/video-with-fallback";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[24rem] overflow-hidden px-4 pb-16 pt-14 sm:px-6 md:min-h-[26rem] md:pb-20 md:pt-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <VideoWithFallback
          videoSrc="/background/bg-video.mp4"
          poster="/background/bg-image.png"
          fallbackImageSrc="/background/bg-image.png"
          videoClassName="opacity-[0.14] sm:opacity-[0.18] dark:opacity-[0.22] dark:sm:opacity-[0.26] scale-105 blur-[1px] dark:blur-0 dark:scale-100"
        />
        <div className="absolute inset-0 bg-background/82 backdrop-blur-[2px] dark:bg-background/75 dark:backdrop-blur-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/[0.97] via-background/75 to-background dark:from-background/95 dark:via-background/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm dark:border-white/[0.06] dark:bg-background/55 dark:shadow-none">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI operating system for elite freelancers
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-[1.08] lg:text-6xl">
          Stop wasting bids.{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-clinq-success bg-clip-text text-transparent">
            Win serious clients.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Clinq scores leads, drafts proposals, tracks your pipeline, and nudges follow-ups—
          without spam or shady automation.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
          <Button size="lg" className="h-12 gap-2 bg-primary px-8 text-primary-foreground shadow-none hover:bg-primary/90" asChild>
            <Link href="/dashboard">
              Enter command center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 border-white/[0.08] bg-background/50 text-foreground hover:bg-background/70" asChild>
            <a href="#features">Capabilities</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
