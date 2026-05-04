"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClinqLogo } from "@/components/brand/clinq-logo";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:justify-normal md:gap-4 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 py-1 md:justify-self-start">
          <ClinqLogo variant="wordmark" className="h-7 w-auto sm:h-8" priority />
        </Link>
        <nav className="hidden items-center gap-10 text-sm text-muted-foreground md:flex md:justify-self-center">
          <a href="#features" className="transition-colors hover:text-foreground">
            Product
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:justify-self-end">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground shadow-none hover:bg-primary/90" asChild>
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
