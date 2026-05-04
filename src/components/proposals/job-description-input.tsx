"use client";

import { useState } from "react";
import {
  FileText,
  Link2,
  Upload,
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
  Globe,
  Clock,
  DollarSign,
  MapPin,
} from "lucide-react";
import { useProposalStudio } from "@/context/proposal-studio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InputMode = "paste" | "url" | "upload";

interface ExtractedData {
  title: string;
  budget: string;
  deadline: string;
  location: string;
  skills: string[];
  keyRequirements: string[];
}

function inferExtracted(text: string): ExtractedData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 120) || "Opportunity";
  const budgetMatch = text.match(/\$[\d,]+(?:\s*-\s*\$?[\d,]+)?|\bUSD\s*[\d,]+/i);
  const budget = budgetMatch ? budgetMatch[0] : "—";
  const remote = /\bremote\b/i.test(text) ? "Remote" : "—";
  const deadline = /\b(asap|urgent|within\s*\d+\s*(day|week|month))\b/i.test(text)
    ? "Tight timeline"
    : /\b(\d+)\s*[-–]\s*(\d+)\s*(week|month)/i.test(text)
      ? text.match(/\b(\d+)\s*[-–]\s*(\d+)\s*(week|month)/i)?.[0] ?? "See brief"
      : "See brief";
  const skills = Array.from(
    new Set(
      ["React", "TypeScript", "Node", "Python", "AWS", "SQL", "Next.js"].filter((k) =>
        new RegExp(`\\b${k}\\b`, "i").test(text),
      ),
    ),
  ).slice(0, 6);
  const keyRequirements = lines.slice(1, 5).filter((l) => l.length > 20 && l.length < 200);

  return {
    title,
    budget,
    deadline,
    location: remote,
    skills: skills.length ? skills : ["Review RFP for stack"],
    keyRequirements: keyRequirements.length
      ? keyRequirements
      : ["Review pasted job description for requirements"],
  };
}

export function JobDescriptionInput() {
  const { rfpText, setRfpText } = useProposalStudio();
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleAnalyze = () => {
    const text = inputMode === "paste" ? rfpText.trim() : url.trim();
    if (!text) return;
    setIsAnalyzing(true);
    const merged = inputMode === "paste" ? text : `${text}\n\n${rfpText.trim()}`.trim();
    setRfpText(merged);
    setExtractedData(inferExtracted(merged));
    setIsAnalyzed(true);
    setIsAnalyzing(false);
  };

  const handleClear = () => {
    setRfpText("");
    setUrl("");
    setIsAnalyzed(false);
    setExtractedData(null);
  };

  return (
    <div className="glass-card rounded-2xl shadow-sm shadow-black/5 ring-1 ring-white/[0.04]">
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Job description</h3>
            <p className="text-xs text-muted-foreground">Synced to proposal AI — paste the full RFP</p>
          </div>
        </div>
        {isAnalyzed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex gap-1 border-b border-clinq-glass-border px-4 py-2">
        {(
          [
            { mode: "paste" as const, label: "Paste text", icon: FileText },
            { mode: "url" as const, label: "URL", icon: Link2 },
            { mode: "upload" as const, label: "Upload", icon: Upload },
          ] as const
        ).map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setInputMode(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200",
              inputMode === mode
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {!isAnalyzed ? (
          <>
            {inputMode === "paste" ? (
              <textarea
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                placeholder="Paste the full job description here…"
                className="h-40 w-full resize-none rounded-xl border border-clinq-glass-border bg-clinq-glass/50 p-4 text-sm text-foreground placeholder:text-muted-foreground transition-shadow duration-200 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : null}

            {inputMode === "url" ? (
              <div className="space-y-3">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                    className="h-11 w-full rounded-xl border border-clinq-glass-border bg-clinq-glass/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL is sent to the model as context. Paste the full posting below for best results.
                </p>
                <textarea
                  value={rfpText}
                  onChange={(e) => setRfpText(e.target.value)}
                  placeholder="Optional: paste job body under the URL…"
                  className="h-28 w-full resize-none rounded-xl border border-clinq-glass-border bg-clinq-glass/50 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ) : null}

            {inputMode === "upload" ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-clinq-glass-border bg-clinq-glass/30">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload coming soon — use Paste for now</p>
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={
                isAnalyzing ||
                inputMode === "upload" ||
                (inputMode === "paste" && !rfpText.trim()) ||
                (inputMode === "url" && !url.trim())
              }
              className="mt-4 w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground transition-opacity hover:opacity-95"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract summary
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-clinq-success/25 bg-clinq-success/10 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-clinq-success" />
              <span className="text-sm font-medium text-clinq-success">Summary ready</span>
            </div>

            {extractedData ? (
              <>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">{extractedData.title}</h4>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-clinq-glass px-2.5 py-1 text-xs">
                      <DollarSign className="h-3 w-3 text-clinq-success" />
                      <span className="text-foreground">{extractedData.budget}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-clinq-glass px-2.5 py-1 text-xs">
                      <Clock className="h-3 w-3 text-primary" />
                      <span className="text-foreground">{extractedData.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-clinq-glass px-2.5 py-1 text-xs">
                      <MapPin className="h-3 w-3 text-accent" />
                      <span className="text-foreground">{extractedData.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">SKILLS (DETECTED)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">SNIPPETS FROM RFP</p>
                  <ul className="space-y-1.5">
                    {extractedData.keyRequirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-clinq-success" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
