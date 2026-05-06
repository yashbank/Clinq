"use client";

import { FileText, History, BookOpen, Send, Save } from "lucide-react";
import { MobileAppNav } from "@/components/dashboard/mobile-app-nav";
import { Button } from "@/components/ui/button";
import { CLINQ_PROPOSAL_COPY_FOR_SEND, CLINQ_PROPOSAL_SAVE_DRAFT } from "@/lib/proposal/studio-events";

interface ProposalStudioHeaderProps {
  onOpenSnippets: () => void;
  onOpenHistory: () => void;
}

export function ProposalStudioHeader({
  onOpenSnippets,
  onOpenHistory,
}: ProposalStudioHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-background/90">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <MobileAppNav />
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Proposal studio</h1>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground sm:text-xs sm:line-clamp-none">
              Paste the RFP on the left, generate in the center, copy into the marketplace. Save draft stays on this device.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Quick Actions */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenSnippets}
            className="hidden gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:flex"
          >
            <BookOpen className="h-4 w-4" />
            Snippets
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="hidden gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:flex"
          >
            <History className="h-4 w-4" />
            History
          </Button>

          <div className="hidden h-5 w-px bg-muted-border sm:block" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 px-2 text-muted-foreground hover:text-foreground md:flex"
            onClick={() => window.dispatchEvent(new Event(CLINQ_PROPOSAL_SAVE_DRAFT))}
          >
            <Save className="h-4 w-4" />
            Save draft
          </Button>

          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-primary px-3 text-xs font-medium text-primary-foreground shadow-none hover:bg-primary/90 sm:text-sm"
            onClick={() => window.dispatchEvent(new Event(CLINQ_PROPOSAL_COPY_FOR_SEND))}
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Copy to send</span>
            <span className="sm:hidden">Send</span>
          </Button>
        </div>
      </div>

    </header>
  );
}
