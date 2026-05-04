"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClinqLogo } from "@/components/brand/clinq-logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DASHBOARD_BOTTOM_NAV, DASHBOARD_MAIN_NAV } from "@/lib/navigation";

export function MobileAppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,18rem)] border-clinq-glass-border p-0 sm:max-w-xs">
        <SheetHeader className="border-b border-clinq-glass-border px-4 py-4 text-left">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link href="/dashboard" onClick={() => setOpen(false)} className="inline-block">
            <ClinqLogo variant="wordmark" className="h-7 w-auto max-w-[7.5rem]" priority />
          </Link>
        </SheetHeader>
        <nav className="flex max-h-[calc(100vh-8rem)] flex-col gap-0.5 overflow-y-auto p-3">
          {[...DASHBOARD_MAIN_NAV, ...DASHBOARD_BOTTOM_NAV].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
              <item.icon className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
