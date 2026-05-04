"use client";

import { useState } from "react";

import { useProposalStudio } from "@/context/proposal-studio";
import {
  Settings,
  Zap,
  FileText,
  Crown,
  Code,
  Heart,
  Target,
  Check,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProposalMode = "premium" | "concise" | "technical";
type ToneStyle = "professional" | "friendly" | "confident" | "consultative";

const proposalModes: {
  id: ProposalMode;
  label: string;
  description: string;
  icon: React.ElementType;
  wordRange: string;
}[] = [
  {
    id: "premium",
    label: "Premium",
    description: "Comprehensive, persuasive proposal for high-value clients",
    icon: Crown,
    wordRange: "400-600 words",
  },
  {
    id: "concise",
    label: "Concise",
    description: "Short and impactful for busy decision-makers",
    icon: Zap,
    wordRange: "150-250 words",
  },
  {
    id: "technical",
    label: "Technical",
    description: "Deep-dive approach for technical stakeholders",
    icon: Code,
    wordRange: "500-800 words",
  },
];

const toneStyles: { id: ToneStyle; label: string; description: string }[] = [
  {
    id: "professional",
    label: "Professional",
    description: "Formal and business-focused",
  },
  {
    id: "friendly",
    label: "Friendly",
    description: "Warm and approachable",
  },
  {
    id: "confident",
    label: "Confident",
    description: "Bold and assertive",
  },
  {
    id: "consultative",
    label: "Consultative",
    description: "Advisory and expert-led",
  },
];

const focusAreas = [
  { id: "value", label: "Value & ROI", icon: Target },
  { id: "experience", label: "Experience", icon: FileText },
  { id: "process", label: "Process & Timeline", icon: Settings },
  { id: "relationship", label: "Relationship", icon: Heart },
];

export function ProposalSettings() {
  const { mode, setMode, tone, setTone } = useProposalStudio();
  const [selectedFocus, setSelectedFocus] = useState<string[]>(["value", "experience"]);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [includePricing, setIncludePricing] = useState(false);
  const [includeTimeline, setIncludeTimeline] = useState(true);

  const toggleFocus = (id: string) => {
    setSelectedFocus((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="glass-card rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Proposal Settings</h3>
            <p className="text-xs text-muted-foreground">
              Customize your proposal style
            </p>
          </div>
        </div>
      </div>

      {/* Proposal Mode */}
      <div className="border-b border-clinq-glass-border p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Proposal Mode
        </p>
        <div className="space-y-2">
          {proposalModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all",
                mode === m.id
                  ? "bg-primary/15 ring-1 ring-primary/30"
                  : "bg-clinq-glass/50 hover:bg-clinq-glass"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  mode === m.id
                    ? "bg-primary/20 text-primary"
                    : "bg-clinq-glass text-muted-foreground"
                )}
              >
                <m.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      mode === m.id ? "text-primary" : "text-foreground"
                    )}
                  >
                    {m.label}
                  </span>
                  {mode === m.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                  {m.description}
                </p>
                <span className="mt-1 inline-block text-[10px] text-muted-foreground/70">
                  {m.wordRange}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tone Selection */}
      <div className="border-b border-clinq-glass-border p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tone & Voice
        </p>
        <div className="grid grid-cols-2 gap-2">
          {toneStyles.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-left transition-all",
                tone === t.id
                  ? "bg-accent/15 ring-1 ring-accent/30"
                  : "bg-clinq-glass/50 hover:bg-clinq-glass"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  tone === t.id ? "text-accent" : "text-foreground"
                )}
              >
                {t.label}
              </span>
              <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      <div className="border-b border-clinq-glass-border p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Focus Areas
        </p>
        <div className="flex flex-wrap gap-2">
          {focusAreas.map((area) => (
            <button
              key={area.id}
              onClick={() => toggleFocus(area.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                selectedFocus.includes(area.id)
                  ? "bg-clinq-success/15 text-clinq-success ring-1 ring-clinq-success/30"
                  : "bg-clinq-glass text-muted-foreground hover:text-foreground"
              )}
            >
              <area.icon className="h-3 w-3" />
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Options */}
      <div className="p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Include Sections
        </p>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Portfolio Links</span>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
            <button
              onClick={() => setIncludePortfolio(!includePortfolio)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                includePortfolio ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  includePortfolio ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Pricing Quote</span>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
            <button
              onClick={() => setIncludePricing(!includePricing)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                includePricing ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  includePricing ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Timeline</span>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
            <button
              onClick={() => setIncludeTimeline(!includeTimeline)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                includeTimeline ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  includeTimeline ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}
