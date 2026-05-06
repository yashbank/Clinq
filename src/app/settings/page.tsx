import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { CurrencyPreferences } from "@/components/settings/currency-preferences";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: row } = await supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle();
  const preferred = typeof row?.preferred_currency === "string" ? row.preferred_currency : "USD";

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Settings" subtitle="Workspace preferences" displayCurrency={preferred} />
        <main className="flex-1 overflow-y-auto p-3 pb-10 sm:p-6">
          <div className="mx-auto max-w-lg space-y-6">
            <p className="text-sm text-muted-foreground">
              Auth and API keys stay in Supabase / Vercel. Use the links below for profile and integrations.
            </p>
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <h2 className="text-sm font-semibold text-foreground">Currency</h2>
              <div className="mt-4">
                <CurrencyPreferences initial={preferred} />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/profile" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                    Freelancer profile
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">Resume, skills, stack, portfolio — powers AI.</p>
                </li>
                <li className="pt-2">
                  <Link href="/integrations" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                    Integrations
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">Connect Freelancer and import leads.</p>
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
