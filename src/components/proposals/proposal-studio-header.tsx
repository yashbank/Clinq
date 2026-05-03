"use client";

import {
  FileText,
  Sparkles,
  History,
  BookOpen,
  Wand2,
  Send,
  Save,
  ChevronDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProposalStudioHeaderProps {
  onOpenSnippets: () => void;
  onOpenHistory: () => void;
}

export function ProposalStudioHeader({
  onOpenSnippets,
  onOpenHistory,
}: ProposalStudioHeaderProps) {
  return (
    <header className="shrink-0 border-b border-clinq-glass-border bg-sidebar/50 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                AI Proposal Studio
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                AI-Powered
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Craft winning proposals with AI intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSnippets}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
            Snippets
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
            History
          </Button>

          <div className="h-6 w-px bg-clinq-glass-border" />

          {/* AI Status */}
          <div className="flex items-center gap-2 rounded-lg bg-clinq-glass px-3 py-1.5">
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-clinq-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-clinq-success" />
            </span>
            <span className="text-xs text-muted-foreground">AI Ready</span>
          </div>

          <div className="h-6 w-px bg-clinq-glass-border" />

          {/* Save & Send */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>

          <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
            <Send className="h-4 w-4" />
            Send Proposal
          </Button>
        </div>
      </div>

      {/* Breadcrumb & Stats */}
      <div className="flex items-center justify-between border-t border-clinq-glass-border/50 bg-sidebar/30 px-6 py-2">
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
