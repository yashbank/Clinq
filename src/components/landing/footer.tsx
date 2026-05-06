import Link from "next/link";
import { Github, Linkedin, ExternalLink } from "lucide-react";

import { OWNER_PUBLIC_LINKS } from "@/lib/site/owner-links";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";

export function Footer() {
  const portfolio = OWNER_PUBLIC_LINKS.portfolio?.trim();

  return (
    <footer className="border-t border-border/80 bg-card/30 px-6 py-14 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row md:items-start">
        <div className="max-w-md text-center md:text-left">
          <p className="font-medium text-foreground">© 2026 Clinq.</p>
          <p className="mt-1 leading-relaxed">Built and owned by Yash Bankar. All rights reserved.</p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-2" aria-label="Owner links">
          <Link href={OWNER_PUBLIC_LINKS.github} target="_blank" rel="noopener noreferrer" className={cn(linkClass)}>
            <Github className="h-4 w-4 shrink-0" aria-hidden />
            <span>GitHub</span>
          </Link>
          <Link href={OWNER_PUBLIC_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className={cn(linkClass)}>
            <Linkedin className="h-4 w-4 shrink-0" aria-hidden />
            <span>LinkedIn</span>
          </Link>
          {portfolio ? (
            <Link href={portfolio} target="_blank" rel="noopener noreferrer" className={cn(linkClass)}>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              <span>Portfolio</span>
            </Link>
          ) : null}
          <Link href="/login" className={cn(linkClass)}>
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
