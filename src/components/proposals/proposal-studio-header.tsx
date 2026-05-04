"use client";

import { FileText, Sparkles, History, BookOpen, Send, Save, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProposalStudioHeaderProps {
  onOpenSnippets: () => void;
  onOpenHistory: () => void;
}

export function ProposalStudioHeader({
  onOpenSnippets,
  onOpenHistory,
}: ProposalStudioHeaderProps) {
  return (
    <header className="shrink-0 border-b border-clinq-glass-border bg-background/90">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                AI Proposal Studio
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                AI-Powered
              </span>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
              Craft winning proposals with AI intelligence
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSnippets}
            className="hidden gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:flex"
          >
            <BookOpen className="h-4 w-4" />
            Snippets
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="hidden gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:flex"
          >
            <History className="h-4 w-4" />
            History
          </Button>

          <div className="hidden h-5 w-px bg-clinq-glass-border sm:block" />

          <div className="hidden items-center gap-1.5 rounded-md border border-clinq-glass-border bg-background/50 px-2 py-1 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clinq-success opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-clinq-success" />
            </span>
            <span className="text-[11px] text-muted-foreground">Ready</span>
          </div>

          <div className="hidden h-5 w-px bg-clinq-glass-border md:block" />

          <Button variant="ghost" size="sm" className="hidden gap-1.5 px-2 text-muted-foreground hover:text-foreground md:flex">
            <Save className="h-4 w-4" />
            Save
          </Button>

          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-primary to-cyan-600 px-3 text-xs font-medium text-primary-foreground shadow-sm sm:text-sm">
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>

      {/* Breadcrumb & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-clinq-glass-border/40 bg-background/50 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">New Proposal</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Untitled</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-clinq-warning" />
            <span className="text-muted-foreground">AI Credits:</span>
            <span className="font-medium text-foreground">247 remaining</span>
          </div>
        </div>
      </div>
    </header>
  );
}
