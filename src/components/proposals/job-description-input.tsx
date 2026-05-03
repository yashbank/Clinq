"use client";

import { useState } from "react";
import {
  FileText,
  Link2,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Globe,
  Clock,
  DollarSign,
  MapPin,
} from "lucide-react";
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

export function JobDescriptionInput() {
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalyzed(true);
      setExtractedData({
        title: "Senior React Developer for SaaS Platform",
        budget: "$15,000 - $25,000",
        deadline: "2-3 months",
        location: "Remote (US timezone preferred)",
        skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
        keyRequirements: [
          "5+ years React experience",
          "Experience with real-time features",
          "Strong communication skills",
          "Startup experience preferred",
        ],
      });
    }, 2000);
  };

  const handleClear = () => {
    setContent("");
    setUrl("");
    setIsAnalyzed(false);
    setExtractedData(null);
  };

  return (
    <div className="glass-card rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Job Description</h3>
            <p className="text-xs text-muted-foreground">
              Paste, link, or upload the job details
            </p>
          </div>
        </div>
        {isAnalyzed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Input Mode Tabs */}
      <div className="flex gap-1 border-b border-clinq-glass-border px-4 py-2">
        {[
          { mode: "paste" as InputMode, label: "Paste Text", icon: FileText },
          { mode: "url" as InputMode, label: "URL", icon: Link2 },
          { mode: "upload" as InputMode, label: "Upload", icon: Upload },
        ].map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              inputMode === mode
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Input Content */}
      <div className="p-4">
        {!isAnalyzed ? (
          <>
            {inputMode === "paste" && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the full job description here..."
                className="h-40 w-full resize-none rounded-xl border border-clinq-glass-border bg-clinq-glass/50 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}

            {inputMode === "url" && (
              <div className="space-y-3">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://upwork.com/job/..."
                    className="h-11 w-full rounded-xl border border-clinq-glass-border bg-clinq-glass/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported: Upwork, Freelancer, Toptal, LinkedIn, and more
                </p>
              </div>
            )}

            {inputMode === "upload" && (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-clinq-glass-border bg-clinq-glass/30 transition-colors hover:border-primary/50 hover:bg-clinq-glass/50">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop PDF, DOC, or TXT file
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  or click to browse
                </p>
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={
                isAnalyzing ||
                (inputMode === "paste" && !content) ||
                (inputMode === "url" && !url)
              }
              className="mt-4 w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Job Description
                </>
              )}
            </Button>
          </>
        ) : (
          /* Extracted Data Display */
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-clinq-success/10 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-clinq-success" />
              <span className="text-sm font-medium text-clinq-success">
                Analysis Complete
              </span>
            </div>

            {extractedData && (
              <>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">
                    {extractedData.title}
                  </h4>
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
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    REQUIRED SKILLS
                  </p>
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
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    KEY REQUIREMENTS
                  </p>
                  <ul className="space-y-1.5">
                    {extractedData.keyRequirements.map((req, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-clinq-success" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
