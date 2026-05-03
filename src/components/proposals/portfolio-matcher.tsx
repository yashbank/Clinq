"use client";

import {
  Briefcase,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  matchScore: number;
  relevance: string[];
  thumbnail: string;
  url: string;
  featured: boolean;
}

const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: "Real-time Analytics Dashboard",
    category: "SaaS",
    matchScore: 96,
    relevance: ["React", "Real-time", "Dashboard", "TypeScript"],
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop",
    url: "#",
    featured: true,
  },
  {
    id: 2,
    title: "Collaborative Workspace App",
    category: "Productivity",
    matchScore: 89,
    relevance: ["React", "WebSocket", "Team collaboration"],
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
    url: "#",
    featured: false,
  },
  {
    id: 3,
    title: "E-commerce Platform",
    category: "E-commerce",
    matchScore: 72,
    relevance: ["React", "PostgreSQL", "AWS"],
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
    url: "#",
    featured: false,
  },
];

export function PortfolioMatcher() {
  const [selectedItems, setSelectedItems] = useState<number[]>([1]);

  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="glass-card rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-clinq-success/20 to-accent/20">
            <Briefcase className="h-4 w-4 text-clinq-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Portfolio Match</h3>
            <p className="text-xs text-muted-foreground">
              AI-recommended for this project
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-clinq-success/20 px-2 py-0.5">
          <Sparkles className="h-3 w-3 text-clinq-success" />
          <span className="text-[10px] font-medium text-clinq-success">
            Auto-matched
          </span>
        </div>
      </div>

      {/* Portfolio Items */}
      <div className="p-4">
        <div className="space-y-3">
          {portfolioItems.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border transition-all",
                  isSelected
                    ? "border-clinq-success/40 bg-clinq-success/5"
                    : "border-clinq-glass-border bg-clinq-glass/30 hover:bg-clinq-glass/50"
                )}
              >
                <div className="flex gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                    {item.featured && (
                      <div className="absolute left-1 top-1 rounded bg-clinq-warning/90 p-0.5">
                        <Star className="h-2.5 w-2.5 fill-white text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <TrendingUp className="h-3 w-3 text-clinq-success" />
                          <span className="text-xs font-semibold text-clinq-success">
                            {item.matchScore}%
                          </span>
                        </div>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      {item.relevance.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.relevance.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{item.relevance.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full transition-all",
                        isSelected
                          ? "bg-clinq-success text-white"
                          : "bg-clinq-glass text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={item.url}
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          className="mt-3 w-full gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Browse Full Portfolio
        </Button>
      </div>

      {/* Selection Summary */}
      {selectedItems.length > 0 && (
        <div className="border-t border-clinq-glass-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedItems.length} project{selectedItems.length > 1 ? "s" : ""}
            </span>{" "}
            will be included in your proposal
          </p>
        </div>
      )}
    </div>
  );
}
