"use client";

import { Bell, Search, Command } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MobileAppNav } from "@/components/dashboard/mobile-app-nav";

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
    [],
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-clinq-glass-border bg-background/90 px-3 backdrop-blur-md sm:gap-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileAppNav />

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle ?? dateLabel}</p>
        </div>
      </div>

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
                  toast.message("Opened Leads", {
                    description: "Use the search field on that page to filter your table.",
                  });
                }
              }
            }}
            placeholder="Search on Leads page — Enter to open"
            className="clinq-input h-9 w-full rounded-lg border border-clinq-glass-border bg-clinq-glass/80 pl-10 pr-20 text-sm text-foreground shadow-none placeholder:text-muted-foreground"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded border border-clinq-glass-border/80 bg-secondary/60 px-1.5 py-0.5">
            <Command className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">K</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
          onClick={() =>
            toast.message("No notification feed yet", {
              description: "Follow-ups and pipeline changes stay in their pages for now.",
            })
          }
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <Button asChild size="sm" className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-none hover:bg-primary/90">
          <Link href="/settings">Account</Link>
        </Button>
      </div>
    </header>
  );
}
