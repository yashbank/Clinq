"use client";

import { useState, useRef } from "react";
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
  ArrowRight,
  Plus,
  Loader2,
  Bold,
  Italic,
  List,
  Link2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProposalStudio } from "@/context/proposal-studio";

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

const aiSuggestions = [
  "Add a specific metric from your past projects",
  "Include a question to encourage dialogue",
  "Reference their company name more naturally",
  "Strengthen the value proposition",
];

const followUpTemplates = [
  { label: "Gentle Reminder", timing: "3 days after" },
  { label: "Value Add", timing: "5 days after" },
  { label: "Last Chance", timing: "7 days after" },
];

export function AIWritingPanel() {
  const { mapModeToApi, tone } = useProposalStudio();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [activeSection, setActiveSection] = useState<WritingSection>("greeting");
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const handleGenerateSection = (sectionId: WritingSection) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isGenerating: true } : s
      )
    );

    // Simulate AI generation
    setTimeout(() => {
      const generatedContent: Record<WritingSection, string> = {
        greeting:
          "Hi Sarah,\n\nI came across your project for a Senior React Developer and was immediately drawn to the technical depth and vision behind what you're building at TechFlow.",
        hook:
          "What caught my attention wasn't just the tech stack—it's the problem you're solving. Real-time collaboration at scale is exactly where I've spent the last 4 years, and I've seen firsthand how the right architecture decisions early on can make or break the user experience.",
        experience:
          "Most recently, I led the frontend architecture for a real-time analytics platform that now serves 50,000+ concurrent users. We achieved sub-100ms updates using a custom WebSocket layer with React Query—something that sounds aligned with your needs.\n\nKey achievements from this project:\n• 3x improvement in perceived performance\n• 60% reduction in server costs through optimized state management\n• Zero-downtime deployments with feature flag rollouts",
        approach:
          "For your SaaS platform, I'd propose a phased approach:\n\nPhase 1 (Weeks 1-3): Architecture foundation\n- Set up Next.js 14 with App Router\n- Implement real-time infrastructure with WebSockets\n- Establish TypeScript patterns and testing framework\n\nPhase 2 (Weeks 4-8): Core features\n- Build the collaborative workspace components\n- Integrate PostgreSQL with optimistic updates\n- Deploy to AWS with auto-scaling\n\nPhase 3 (Weeks 9-12): Polish & Launch\n- Performance optimization\n- Security audit\n- Production deployment with monitoring",
        closing:
          "I'd love to discuss how we can bring this vision to life together. Would you be available for a quick 20-minute call this week? I can walk you through a similar project I built and answer any technical questions.\n\nLooking forward to hearing from you,\nAlex",
      };

      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, content: generatedContent[sectionId], isGenerating: false }
            : s
        )
      );
    }, 1500);
  };

  const handleGenerateAll = async () => {
    const jobDescription = sections.map((s) => `${s.label}:\n${s.content}`).join("\n\n").trim();
    if (jobDescription.length < 20) {
      toast.error("Add RFP text across sections (or paste into Opening) before generating.");
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
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed");
      }
      if (!data.text) {
        throw new Error("Empty response");
      }
      setSections((prev) => {
        const [, ...rest] = prev;
        return [{ ...prev[0], content: data.text as string, isGenerating: false }, ...rest.map((s) => ({ ...s, isGenerating: false }))];
      });
      setActiveSection("greeting");
      toast.success("Proposal generated with GPT-4o mini");
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

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border bg-sidebar/50 px-5 py-3">
        <div className="flex items-center gap-2">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1 rounded-lg bg-clinq-glass p-1">
            <button className="rounded p-1.5 text-muted-foreground hover:bg-clinq-glass hover:text-foreground">
              <Bold className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-clinq-glass hover:text-foreground">
              <Italic className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-clinq-glass hover:text-foreground">
              <List className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-clinq-glass hover:text-foreground">
              <Link2 className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-clinq-glass-border" />

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
                    : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground",
                  section.content && "ring-1 ring-inset ring-clinq-success/30"
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-clinq-glass text-[10px]">
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
                    ? "border-primary/50 bg-clinq-glass shadow-lg shadow-primary/5"
                    : "border-clinq-glass-border bg-clinq-glass/30 hover:border-clinq-glass-border hover:bg-clinq-glass/50"
                )}
              >
                <div className="flex items-center justify-between border-b border-clinq-glass-border/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                      {sections.findIndex((s) => s.id === section.id) + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.content && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Regenerate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateSection(section.id)}
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
            <div className="rounded-2xl border border-clinq-glass-border bg-clinq-glass/30 p-4">
              <button
                onClick={() => setShowFollowUps(!showFollowUps)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    AI Follow-up Sequence
                  </span>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                    Auto-Generated
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
                      className="flex items-center justify-between rounded-lg bg-clinq-glass/50 px-4 py-3"
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

        {/* AI Suggestions Sidebar */}
        <div className="w-64 shrink-0 border-l border-clinq-glass-border bg-sidebar/30 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-clinq-warning" />
            <span className="text-xs font-medium text-foreground">
              AI Suggestions
            </span>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((suggestion, i) => (
              <button
                key={i}
                className="group flex w-full items-start gap-2 rounded-lg bg-clinq-glass/50 p-3 text-left transition-colors hover:bg-clinq-glass"
              >
                <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                  {suggestion}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tone Check
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Professional</span>
                <span className="text-clinq-success">Strong</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-clinq-glass">
                <div className="h-full w-4/5 rounded-full bg-clinq-success" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Personalized</span>
                <span className="text-primary">Good</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-clinq-glass">
                <div className="h-full w-3/5 rounded-full bg-primary" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Persuasive</span>
                <span className="text-accent">Moderate</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-clinq-glass">
                <div className="h-full w-1/2 rounded-full bg-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
