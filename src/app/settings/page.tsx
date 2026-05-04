import Link from "next/link";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { ArrowUpRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Settings" subtitle="Workspace preferences" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-lg space-y-4">
            <p className="text-sm text-muted-foreground">
              Auth and API keys stay in Supabase / Vercel. Use the links below for the Phase 2 workflow surfaces.
            </p>
            <div className="rounded-2xl border border-clinq-glass-border/80 bg-background/50 p-5">
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                  >
                    Freelancer profile
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">Resume, skills, stack, portfolio — powers AI.</p>
                </li>
                <li className="pt-2">
                  <Link
                    href="/integrations"
                    className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                  >
                    Integrations
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">Marketplace link placeholders (no scraping yet).</p>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
