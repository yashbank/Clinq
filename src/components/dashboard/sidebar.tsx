"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LogOut, Moon, Pin, PinOff, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { ClinqLogo } from "@/components/brand/clinq-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DASHBOARD_BOTTOM_NAV, DASHBOARD_MAIN_NAV } from "@/lib/navigation";

const PIN_KEY = "clinq-sidebar-pinned";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    try {
      setPinned(localStorage.getItem(PIN_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    try {
      localStorage.setItem(PIN_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const labelClass =
    "min-w-0 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out group-hover/sidebar:max-w-[220px] group-hover/sidebar:opacity-100 group-hover/sidebar:mr-0 group-data-[expanded=true]/sidebar:max-w-[220px] group-data-[expanded=true]/sidebar:opacity-100";

  const linkBase =
    "group/nav flex w-full items-center gap-0 rounded-lg py-2 text-[13px] font-medium leading-snug transition-colors duration-150 active:scale-[0.98] group-hover/sidebar:gap-3 group-hover/sidebar:px-2.5 group-data-[expanded=true]/sidebar:gap-3 group-data-[expanded=true]/sidebar:px-2.5";

  const renderLink = (item: (typeof DASHBOARD_MAIN_NAV)[number]) => {
    const isActive =
      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        className={cn(
          linkBase,
          "justify-center px-0 group-hover/sidebar:justify-start group-data-[expanded=true]/sidebar:justify-start",
          isActive
            ? "border border-primary/25 bg-primary/10 text-foreground"
            : "border border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-primary",
          )}
        />
        <span className={cn("flex flex-1 items-center justify-between text-left", labelClass)}>
          <span className="truncate">{item.label}</span>
          {item.badge ? (
            <span
              className={cn(
                "ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                item.badge === "AI" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent",
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </span>
      </Link>
    );
  };

  return (
    <aside
      data-expanded={pinned ? "true" : "false"}
      className={cn(
        "group/sidebar relative hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-300 ease-out md:flex",
        pinned ? "w-56" : "w-[4.25rem] hover:w-56",
      )}
    >
      <div className="relative flex h-14 shrink-0 items-center border-b border-border px-2 transition-[padding] duration-300 group-hover/sidebar:px-3 group-data-[expanded=true]/sidebar:px-3">
        <Link
          href="/dashboard"
          className="flex min-w-0 flex-1 items-center justify-center gap-2 py-1 pr-8 group-hover/sidebar:justify-start group-hover/sidebar:pr-2 group-data-[expanded=true]/sidebar:justify-start group-data-[expanded=true]/sidebar:pr-2"
        >
          <span className="flex shrink-0 items-center justify-center group-hover/sidebar:hidden group-data-[expanded=true]/sidebar:hidden">
            <ClinqLogo width={28} height={28} className="h-7 w-7" priority />
          </span>
          <span className="hidden min-w-0 flex-1 group-hover/sidebar:block group-data-[expanded=true]/sidebar:block">
            <ClinqLogo variant="wordmark" className="h-7 w-full max-w-[9rem] object-contain object-left" priority />
          </span>
        </Link>
        <button
          type="button"
          onClick={togglePin}
          title={pinned ? "Unpin sidebar" : "Pin open"}
          className="absolute right-1.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-pressed={pinned}
        >
          {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col space-y-0.5 overflow-y-auto overflow-x-hidden p-2">
        {DASHBOARD_MAIN_NAV.map(renderLink)}
      </nav>

      <div className="flex justify-center border-t border-border p-2">
        <button
          type="button"
          title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="shrink-0 space-y-0.5 border-t border-border p-2">
        {DASHBOARD_BOTTOM_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              linkBase,
              "justify-center px-0 text-muted-foreground hover:bg-muted/60 hover:text-foreground group-hover/sidebar:justify-start group-hover/sidebar:px-2.5 group-data-[expanded=true]/sidebar:justify-start group-data-[expanded=true]/sidebar:px-2.5",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover/nav:text-primary" />
            <span className={cn(labelClass, "flex-1 truncate text-left text-foreground")}>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-2">
        <div
          className={cn(
            "flex items-center gap-0 rounded-md py-2 transition-[gap,padding] duration-300 group-hover/sidebar:gap-2.5 group-hover/sidebar:px-2.5 group-data-[expanded=true]/sidebar:gap-2.5 group-data-[expanded=true]/sidebar:px-2.5",
            "justify-center group-hover/sidebar:justify-start group-data-[expanded=true]/sidebar:justify-start",
          )}
        >
          <div className="relative h-9 w-9 shrink-0">
            <div className="h-full w-full rounded-full bg-gradient-to-br from-primary/90 to-accent/80" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-clinq-success" />
          </div>
          <div className={cn("min-w-0 flex-1 overflow-hidden", labelClass)}>
            <p className="truncate text-sm font-medium text-foreground">
              {user?.user_metadata?.full_name || user?.email || "Signed in"}
            </p>
            <p className="truncate text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>
        <div className="mt-1.5 flex justify-center group-hover/sidebar:justify-stretch group-data-[expanded=true]/sidebar:justify-stretch">
          <button
            type="button"
            title="Sign out"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="flex w-full max-w-[2.25rem] items-center justify-center gap-2 rounded-md border border-border py-2 text-muted-foreground transition-[max-width] duration-300 hover:bg-muted/60 hover:text-foreground group-hover/sidebar:max-w-none group-data-[expanded=true]/sidebar:max-w-none"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn("hidden whitespace-nowrap text-xs font-medium group-hover/sidebar:inline group-data-[expanded=true]/sidebar:inline")}>
              Sign out
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
