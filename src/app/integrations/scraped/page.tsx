import Link from "next/link";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ScrapedRow = {
  id: string;
  source: string;
  short_summary: string | null;
  skip_reason: string | null;
  created_at: string;
  processed: boolean;
  raw_data: Record<string, unknown>;
};

function platformLabel(source: string): string {
  const s = source.trim();
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function listingTitle(row: ScrapedRow): string {
  const sum = typeof row.short_summary === "string" ? row.short_summary.trim() : "";
  if (sum) return sum.slice(0, 200);
  const fp = row.raw_data?.freelancer_project;
  if (fp && typeof fp === "object" && !Array.isArray(fp)) {
    const t = String((fp as Record<string, unknown>).title ?? "").trim();
    if (t) return t.slice(0, 200);
  }
  return "Untitled listing";
}

function rawSnippet(row: ScrapedRow): string {
  const fp = row.raw_data?.freelancer_project;
  if (fp && typeof fp === "object" && !Array.isArray(fp)) {
    const rec = fp as Record<string, unknown>;
    const desc = String(rec.preview_description ?? rec.description ?? "").trim();
    if (desc) return (desc.length > 180 ? `${desc.slice(0, 180)}…` : desc) || "—";
  }
  return "—";
}

export default async function ScrapedLeadsReviewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profRow } = await supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle();
  const displayCurrency =
    typeof profRow?.preferred_currency === "string" && profRow.preferred_currency.trim()
      ? profRow.preferred_currency.trim()
      : "USD";

  const { data: rows, error } = await supabase
    .from("scraped_leads")
    .select("id, source, short_summary, skip_reason, created_at, processed, raw_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Scraped leads" subtitle="Review-only staging from imports" displayCurrency={displayCurrency} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Rows stay here for audit; promoted listings appear on{" "}
                <Link href="/leads" className="font-medium text-primary underline-offset-4 hover:underline">
                  Leads
                </Link>
                .{" "}
                <Link href="/integrations" className="font-medium text-primary underline-offset-4 hover:underline">
                  ← Integrations
                </Link>
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error.message}
              </p>
            ) : !rows?.length ? (
              <div className="rounded-2xl border border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
                No scraped rows yet. Run a Freelancer import to populate this list.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Platform</th>
                        <th className="px-4 py-3">Raw summary</th>
                        <th className="px-4 py-3">Skip reason</th>
                        <th className="px-4 py-3 text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(rows as ScrapedRow[]).map((row) => (
                        <tr key={row.id} className="align-top hover:bg-muted/15">
                          <td className="max-w-[200px] px-4 py-3 font-medium text-foreground">{listingTitle(row)}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs">
                              {platformLabel(row.source)}
                            </span>
                          </td>
                          <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                            <span className="line-clamp-3 leading-snug">{rawSnippet(row)}</span>
                          </td>
                          <td className="max-w-[220px] px-4 py-3 text-muted-foreground">
                            {row.skip_reason?.trim() ? (
                              <span className="line-clamp-3 leading-snug">{row.skip_reason}</span>
                            ) : row.processed ? (
                              "—"
                            ) : (
                              <span className="text-xs italic">Pending processing</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {new Date(row.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
