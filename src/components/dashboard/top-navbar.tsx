"use client";

import { Bell, Search, Command, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function TopNavbar({
  title = "Command Center",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    []
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-clinq-glass-border bg-background/80 px-4 sm:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle ?? dateLabel}</p>
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden w-full max-w-lg lg:block">
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                router.push("/leads");
                if (search.trim()) {
                  toast.message("Opened Leads", { description: "Use the search field on that page to filter your table." });
                }
              }
            }}
            placeholder="Search on Leads page — Enter to open Leads"
            className="h-9 w-full rounded-lg border border-clinq-glass-border bg-clinq-glass pl-10 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded border border-clinq-glass-border bg-secondary/50 px-1.5 py-0.5">
            <Command className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">K</span>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        {/* Notifications */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
          onClick={() =>
            toast.message("No notification feed yet", {
              description: "Follow-ups and pipeline changes stay in their pages for now.",
            })
          }
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* AI Status */}
        <div className="hidden items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 lg:flex">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">AI Active</span>
        </div>

        <Button
          asChild
          className="h-8 rounded-md bg-gradient-to-r from-primary to-cyan-600 px-3 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
        >
          <Link href="/settings">Account</Link>
        </Button>
      </div>
    </header>
  );
}
