"use client";

import { Bell, Search, Command, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export function TopNavbar({
  title = "Command Center",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
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
    <header className="flex h-14 items-center justify-between border-b border-clinq-glass-border bg-background/50 px-6 backdrop-blur-xl">
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
            placeholder="Search leads, proposals, analytics..."
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
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 gap-2 rounded-lg text-xs text-muted-foreground hover:bg-clinq-glass hover:text-foreground md:flex"
        >
          <Calendar className="h-3.5 w-3.5" />
          3 meetings today
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
        </Button>

        {/* AI Status */}
        <div className="hidden items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 lg:flex">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">AI Active</span>
        </div>

        {/* Upgrade Button */}
        <Button className="h-8 rounded-lg bg-gradient-to-r from-primary to-accent px-3 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
          Upgrade
        </Button>
      </div>
    </header>
  );
}
