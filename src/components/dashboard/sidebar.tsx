"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Sparkles,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Command Center", href: "/dashboard" },
  { icon: Target, label: "Lead Intelligence", href: "/leads", badge: "AI" },
  { icon: FileText, label: "Proposals", href: "/proposals" },
  { icon: Users, label: "Pipeline", href: "/pipeline" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MessageSquare, label: "Follow-ups", href: "/follow-ups", badge: "2" },
  { icon: Zap, label: "Automations", href: "/automations" },
];

const bottomItems = [{ icon: Settings, label: "Settings", href: "/settings" }];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-clinq-glass-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-clinq-glass-border px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-80" />
            <Sparkles className="relative z-10 h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Clinq
            </span>
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-clinq-glass-border bg-secondary text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "glass-card ai-glow-subtle text-foreground"
                  : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
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
      <div className="border-t border-clinq-glass-border p-3">
        {bottomItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-clinq-glass hover:text-foreground"
          >
            <item.icon className="h-5 w-5 shrink-0 transition-colors group-hover:text-primary" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* User Profile */}
      <div className="border-t border-clinq-glass-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
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
                Alex Morgan
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Pro Plan
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
