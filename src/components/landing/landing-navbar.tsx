"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClinqLogo } from "@/components/brand/clinq-logo";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-clinq-glass-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <ClinqLogo width={36} height={36} priority className="h-9 w-9 shrink-0" />
          <span className="text-lg font-semibold tracking-tight">Clinq</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Product
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground" asChild>
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
