"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plug,
  UserCircle2,
} from "lucide-react";

import { ClinqLogo } from "@/components/brand/clinq-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navItems = [
  { icon: LayoutDashboard, label: "Command Center", href: "/dashboard" },
  { icon: Target, label: "Lead Intelligence", href: "/leads", badge: "AI" },
  { icon: FileText, label: "Proposals", href: "/proposals" },
  { icon: Users, label: "Pipeline", href: "/pipeline" },
  { icon: UserCircle2, label: "Profile", href: "/profile" },
  { icon: Plug, label: "Integrations", href: "/integrations" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MessageSquare, label: "Follow-ups", href: "/follow-ups" },
  { icon: Zap, label: "Automations", href: "/automations" },
];

const bottomItems = [{ icon: Settings, label: "Settings", href: "/settings" }];

export function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-clinq-glass-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-clinq-glass-border px-3">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center justify-center gap-2 py-1">
          {collapsed ? (
            <ClinqLogo width={32} height={32} className="h-8 w-8 shrink-0" priority />
          ) : (
            <ClinqLogo variant="wordmark" className="h-7 w-full max-w-[9.5rem] object-contain object-left" priority />
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[calc(3.5rem-0.75rem)] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-clinq-glass-border bg-secondary text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium leading-snug transition-colors duration-150",
                isActive
                  ? "border border-primary/25 bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-primary"
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        item.badge === "AI"
                          ? "bg-primary/20 text-primary"
                          : "bg-accent/20 text-accent"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="shrink-0 border-t border-clinq-glass-border p-2">
        {bottomItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-white/[0.04] hover:text-foreground"
          >
            <item.icon className="h-5 w-5 shrink-0 transition-colors group-hover:text-primary" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* User Profile */}
      <div className="shrink-0 border-t border-clinq-glass-border p-2">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2",
            collapsed && "justify-center"
          )}
        >
          <div className="relative h-9 w-9 shrink-0">
            <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-accent" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-clinq-success" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.user_metadata?.full_name || user?.email || "Signed in"}
              </p>
              <p className="truncate text-xs text-muted-foreground">Clinq workspace</p>
            </div>
          )}
        </div>
        {!collapsed ? (
          <button
            type="button"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-md border border-clinq-glass-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}
