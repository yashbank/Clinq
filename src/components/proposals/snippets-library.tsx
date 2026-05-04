"use client";

import { useState } from "react";
import {
  X,
  Search,
  BookOpen,
  Plus,
  Copy,
  Check,
  Star,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SnippetsLibraryProps {
  onClose: () => void;
}

const categories = [
  { id: "all", label: "All Snippets", count: 24 },
  { id: "openings", label: "Openings", count: 6 },
  { id: "experience", label: "Experience", count: 5 },
  { id: "closing", label: "Closings", count: 4 },
  { id: "pricing", label: "Pricing", count: 3 },
  { id: "guarantees", label: "Guarantees", count: 3 },
  { id: "custom", label: "My Snippets", count: 3 },
];

const snippets = [
  {
    id: 1,
    title: "ROI-Focused Opening",
    category: "openings",
    content:
      "I noticed you're looking for someone who can deliver measurable results, not just code. In my last project, I helped a similar SaaS company increase their conversion rate by 40% through strategic UX improvements.",
    winRate: 78,
    uses: 42,
    starred: true,
    aiGenerated: false,
  },
  {
    id: 2,
    title: "Technical Expertise Hook",
    category: "openings",
    content:
      "With 7+ years specializing in React and real-time applications, I've architected systems that handle millions of concurrent users. Your project's technical requirements align perfectly with my expertise.",
    winRate: 72,
    uses: 38,
    starred: true,
    aiGenerated: false,
  },
  {
    id: 3,
    title: "Startup Experience",
    category: "experience",
    content:
      "Having worked with 15+ startups from seed to Series B, I understand the pace and pivot-ready mindset you need. I've worn many hats—from solo developer to leading a team of 5.",
    winRate: 65,
    uses: 28,
    starred: false,
    aiGenerated: true,
  },
  {
    id: 4,
    title: "Enterprise Track Record",
    category: "experience",
    content:
      "My portfolio includes projects for Fortune 500 companies including [Company A], [Company B], and [Company C]. I bring enterprise-level quality standards to every project, regardless of size.",
    winRate: 70,
    uses: 22,
    starred: false,
    aiGenerated: false,
  },
  {
    id: 5,
    title: "Money-Back Guarantee",
    category: "guarantees",
    content:
      "I'm so confident in delivering value that I offer a 100% satisfaction guarantee on the first milestone. If you're not completely satisfied with the quality and communication, I'll refund your payment—no questions asked.",
    winRate: 82,
    uses: 56,
    starred: true,
    aiGenerated: false,
  },
  {
    id: 6,
    title: "Consultative Close",
    category: "closing",
    content:
      "I'd love to learn more about your vision and explore how we can work together. Would you be open to a 20-minute discovery call this week? I'll come prepared with initial ideas tailored to your project.",
    winRate: 75,
    uses: 67,
    starred: true,
    aiGenerated: false,
  },
];

export function SnippetsLibrary({ onClose }: SnippetsLibraryProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredSnippets = snippets.filter((snippet) => {
    const matchesCategory =
      activeCategory === "all" || snippet.category === activeCategory;
    const matchesSearch =
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col border-l border-clinq-glass-border bg-sidebar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-clinq-glass-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Snippets Library
              </h2>
              <p className="text-sm text-muted-foreground">
                Reusable content blocks with win rates
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 border-b border-clinq-glass-border px-6 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-clinq-glass-border bg-clinq-glass pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            New Snippet
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-48 shrink-0 border-r border-clinq-glass-border p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categories
            </p>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      "text-xs",
                      activeCategory === cat.id
                        ? "text-primary/70"
                        : "text-muted-foreground/60"
                    )}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Snippets List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {filteredSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="group rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-4 transition-all hover:border-clinq-glass-border hover:bg-clinq-glass/50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">
                        {snippet.title}
                      </h4>
                      {snippet.starred && (
                        <Star className="h-3.5 w-3.5 fill-clinq-warning text-clinq-warning" />
                      )}
                      {snippet.aiGenerated && (
                        <span className="flex items-center gap-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(snippet.id, snippet.content)}
                      className="h-7 gap-1 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {copiedId === snippet.id ? (
                        <>
                          <Check className="h-3 w-3 text-clinq-success" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {snippet.content}
                  </p>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-clinq-success" />
                      <span className="text-muted-foreground">Win rate:</span>
                      <span className="font-medium text-clinq-success">
                        {snippet.winRate}%
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Used {snippet.uses} times
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
