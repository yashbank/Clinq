"use client";

import { Briefcase } from "lucide-react";

/**
 * MVP: no scraped portfolio or auto-match. Avoids demo thumbnails and fake match scores (BRD).
 */
export function PortfolioMatcher() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-clinq-success/20 to-accent/20">
          <Briefcase className="h-4 w-4 text-clinq-success" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Portfolio</h3>
          <p className="text-xs text-muted-foreground">Highlight relevant work in the RFP panel or the “Relevant Experience” section.</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Automated portfolio matching against live job posts is not enabled in this build. Your proposal content and pasted case bullets are what the model uses.
        </p>
      </div>
    </div>
  );
}
