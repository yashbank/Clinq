import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  Zap,
  Target,
  Plug,
  UserCircle2,
} from "lucide-react";

export type DashboardNavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
};

export const DASHBOARD_MAIN_NAV: DashboardNavItem[] = [
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

export const DASHBOARD_BOTTOM_NAV: DashboardNavItem[] = [
  { icon: Settings, label: "Settings", href: "/settings" },
];
