"use client";

import { useState, useRef, useEffect, useMemo, memo } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Wand2,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Zap,
  MessageSquare,
  Plus,
  Loader2,
  Bold,
  Italic,
  List,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProposalStudio } from "@/context/proposal-studio";
import { ProposalQualityPanel } from "@/components/proposals/proposal-quality-panel";
import { parseProposalEvaluation } from "@/lib/proposal/parse-evaluation";
import type { ProposalEvaluationRecord } from "@/lib/ai/evaluators/proposal-quality";
import { CLINQ_PROPOSAL_COPY_FOR_SEND, CLINQ_PROPOSAL_SAVE_DRAFT } from "@/lib/proposal/studio-events";

type WritingSection = "greeting" | "hook" | "experience" | "approach" | "closing";

interface Section {
  id: WritingSection;
  label: string;
  content: string;
  isGenerating: boolean;
}

const initialSections: Section[] = [
  {
    id: "greeting",
    label: "Opening",
    content: "",
    isGenerating: false,
  },
  {
    id: "hook",
    label: "The Hook",
    content: "",
    isGenerating: false,
  },
  {
    id: "experience",
    label: "Relevant Experience",
    content: "",
    isGenerating: false,
  },
  {
    id: "approach",
    label: "Proposed Approach",
    content: "",
    isGenerating: false,
  },
  {
    id: "closing",
    label: "Call to Action",
    content: "",
    isGenerating: false,
  },
];

const DEFAULT_EDITOR_TIPS = [
  "Tie claims to phrases in the RFP—avoid generic superlatives.",
  "Prefer one clear CTA over multiple competing asks.",
  "State scope boundaries so buyers know what milestone one covers.",
] as const;

const followUpTemplates = [
  { label: "Gentle Reminder", timing: "3 days after" },
  { label: "Value Add", timing: "5 days after" },
  { label: "Last Chance", timing: "7 days after" },
];

const DRAFT_KEY = "clinq_proposal_draft_v1";

export const AIWritingPanel = memo(function AIWritingPanel() {
  const { mapModeToApi, tone, rfpText, setRfpText } = useProposalStudio();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [activeSection, setActiveSection] = useState<WritingSection>("greeting");
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<ProposalEvaluationRecord | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const rfpRef = useRef(rfpText);
  rfpRef.current = rfpText;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { sections?: Section[]; rfp?: string };
      if (parsed.sections?.length === initialSections.length) {
        setSections(
          parsed.sections.map((s) => ({
            ...s,
            isGenerating: false,
          })),
        );
      }
      if (typeof parsed.rfp === "string" && parsed.rfp.trim()) {
        setRfpText(parsed.rfp);
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, [setRfpText]);

  useEffect(() => {
    const onSaveDraft = () => {
      try {
        const payload = {
          sections: sectionsRef.current.map((s) => ({ ...s, isGenerating: false })),
          rfp: rfpRef.current,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        toast.success("Draft saved on this device");
      } catch {
        toast.error("Could not save draft (browser storage may be blocked).");
      }
    };

    const onCopyForSend = () => {
      const full = sectionsRef.current.map((s) => s.content).join("\n\n").trim();
      if (!full) {
        toast.error("Write or generate your proposal first, then copy to send.");
        return;
      }
      void navigator.clipboard.writeText(full);
      toast.success("Copied — paste into the job platform to submit.");
    };

    window.addEventListener(CLINQ_PROPOSAL_SAVE_DRAFT, onSaveDraft);
    window.addEventListener(CLINQ_PROPOSAL_COPY_FOR_SEND, onCopyForSend);
    return () => {
      window.removeEventListener(CLINQ_PROPOSAL_SAVE_DRAFT, onSaveDraft);
      window.removeEventListener(CLINQ_PROPOSAL_COPY_FOR_SEND, onCopyForSend);
    };
  }, []);

  const handleGenerateSection = async (sectionId: WritingSection) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const rfp = rfpText.trim();
    const draftNotes = sections.map((s) => `${s.label}: ${s.content}`).join("\n");
    if (rfp.length < 12 && draftNotes.replace(/:\s*$/gm, "").length < 30) {
      toast.error("Add RFP text in the job panel (left) or type context in the sections first.");
      return;
    }

    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, isGenerating: true } : s)));

    try {
      const other = sections
        .filter((s) => s.id !== sectionId)
        .map((s) => `${s.label}: ${s.content || "(empty)"}`)
        .join("\n");
      const jobDescription = `[Write ONLY the "${section.label}" section of a professional client proposal. Use plain paragraphs, no markdown # headings.]\n\nRFP / opportunity:\n${rfp || "See section notes below."}\n\nOther sections (reference only):\n${other}`;

      const res = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          mode: "short",
          tone,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed");
      }
      if (!data.text?.trim()) {
        throw new Error("Empty response");
      }
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, content: data.text as string, isGenerating: false } : s)),
      );
      toast.success(`${section.label} generated`);
    } catch (e) {
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, isGenerating: false } : s)));
      toast.error(e instanceof Error ? e.message : "Could not generate section");
    }
  };

  const handleGenerateAll = async () => {
    const fromRfp = rfpText.trim();
    const fromSections = sections.map((s) => `${s.label}:\n${s.content}`).join("\n\n").trim();
    const jobDescription =
      fromRfp.length >= 20
        ? `Compose a complete client proposal from the following RFP. Use clear sections that map to: Opening, Hook, Relevant experience, Proposed approach, Closing CTA.\n\n--- RFP ---\n${fromRfp}\n\n--- Workspace notes ---\n${fromSections || "(none)"}`
        : fromSections;
    if (jobDescription.length < 20) {
      toast.error("Paste the job description in the left panel, or add at least ~20 characters across sections.");
      return;
    }

    setIsGeneratingAll(true);
    try {
      const res = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          mode: mapModeToApi(),
          tone,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string; evaluation?: unknown };
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed");
      }
      if (!data.text) {
        throw new Error("Empty response");
      }
      setLastEvaluation(data.evaluation ? parseProposalEvaluation(data.evaluation) ?? null : null);
      setSections((prev) => {
        const [, ...rest] = prev;
        return [{ ...prev[0], content: data.text as string, isGenerating: false }, ...rest.map((s) => ({ ...s, isGenerating: false }))];
      });
      setActiveSection("greeting");
      toast.success("Draft ready — review before sending");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleCopyAll = () => {
    const fullProposal = sections.map((s) => s.content).join("\n\n");
    navigator.clipboard.writeText(fullProposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSectionContent = (id: WritingSection, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s))
    );
  };

  const wordCount = sections.reduce(
    (acc, s) => acc + s.content.split(/\s+/).filter(Boolean).length,
    0
  );

  const sidebarTips = useMemo(() => {
    if (lastEvaluation?.improvements?.length) {
      return lastEvaluation.improvements.slice(0, 5);
    }
    if (lastEvaluation?.notes?.length) {
      return lastEvaluation.notes.slice(0, 5);
    }
    return [...DEFAULT_EDITOR_TIPS];
  }, [lastEvaluation]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-sidebar/50 px-5 py-3">
        <div className="flex items-center gap-2">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1" title="Rich formatting is not applied in-app yet — paste from Docs if you need styles.">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded p-1.5 text-muted-foreground opacity-40"
              aria-disabled
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded p-1.5 text-muted-foreground opacity-40"
              aria-disabled
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded p-1.5 text-muted-foreground opacity-40"
              aria-disabled
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded p-1.5 text-muted-foreground opacity-40"
              aria-disabled
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-muted-border" />

          {/* Section Navigation */}
          <div className="flex items-center gap-1">
            {sections.map((section, i) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                  activeSection === section.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  section.content && "ring-1 ring-inset ring-clinq-success/30"
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px]">
                  {i + 1}
                </span>
                {section.label}
                {section.content && (
                  <Check className="h-3 w-3 text-clinq-success" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {wordCount} words
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-clinq-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All
              </>
            )}
          </Button>

          <Button
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Full Proposal
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Writing Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-3xl space-y-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "group rounded-2xl border transition-all",
                  activeSection === section.id
                    ? "border-primary/50 bg-muted shadow-lg shadow-primary/5"
                    : "border-border bg-muted/30 hover:border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                      {sections.findIndex((s) => s.id === section.id) + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.content ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => void handleGenerateSection(section.id)}
                        disabled={section.isGenerating}
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Regenerate
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => void handleGenerateSection(section.id)}
                      disabled={section.isGenerating}
                      className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
                    >
                      {section.isGenerating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Writing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          AI Write
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  {section.isGenerating ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent opacity-20 animate-pulse" />
                          <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          AI is crafting your {section.label.toLowerCase()}...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      ref={(el) => { textareaRefs.current[section.id] = el; }}
                      value={section.content}
                      onChange={(e) =>
                        updateSectionContent(section.id, e.target.value)
                      }
                      onFocus={() => setActiveSection(section.id)}
                      placeholder={`Write your ${section.label.toLowerCase()} here or click "AI Write" to generate...`}
                      className="min-h-[120px] w-full resize-none bg-transparent text-sm text-foreground leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Follow-up Templates */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <button
                onClick={() => setShowFollowUps(!showFollowUps)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    AI Follow-up Sequence
                  </span>
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Manual drafts
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    showFollowUps && "rotate-180"
                  )}
                />
              </button>

              {showFollowUps && (
                <div className="mt-4 space-y-3">
                  {followUpTemplates.map((template, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {template.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {template.timing}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        <Sparkles className="h-3 w-3" />
                        Generate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quality + tips — no fabricated scores */}
        <div className="w-64 shrink-0 overflow-y-auto border-l border-border bg-sidebar/30 p-4">
          {lastEvaluation ? (
            <div className="mb-5">
              <ProposalQualityPanel evaluation={lastEvaluation} />
            </div>
          ) : (
            <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
              Run <span className="text-foreground">Generate full proposal</span> to score the draft against your RFP and profile context.
            </p>
          )}

          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Refinement cues</span>
          </div>
          <ul className="space-y-2">
            {sidebarTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-left">
                <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-[11px] leading-snug text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});
