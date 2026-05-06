import Link from "next/link";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { ScrapedPromoteButton } from "@/components/integrations/scraped-promote-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type ScrapedRow = {
  id: string;
  source: string;
  short_summary: string | null;
  skip_reason: string | null;
  created_at: string;
  processed: boolean;
  raw_data: Record<string, unknown>;
  relevance_score: number | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

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
  const rd = row.raw_data?.reddit_listing;
  const rr = asRecord(rd);
  if (rr) {
    const t = String(rr.title ?? "").trim();
    if (t) return t.slice(0, 200);
  }
  const gi = row.raw_data?.github_issue;
  const gr = asRecord(gi);
  if (gr) {
    const t = String(gr.title ?? "").trim();
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
  const rd = row.raw_data?.reddit_listing;
  const rr = asRecord(rd);
  if (rr) {
    const st = String(rr.selftext ?? "").trim();
    if (st) return (st.length > 180 ? `${st.slice(0, 180)}…` : st) || "—";
  }
  const gi = row.raw_data?.github_issue;
  const gr = asRecord(gi);
  if (gr) {
    const b = String(gr.body ?? "").trim();
    if (b) return (b.length > 180 ? `${b.slice(0, 180)}…` : b) || "—";
  }
  return "—";
}

function sanitizeToken(raw: string | undefined, max = 48): string | null {
  if (!raw) return null;
  const t = raw.trim().replace(/[%_]/g, "").slice(0, max);
  return t.length ? t : null;
}

const SOURCE_LINKS = ["all", "freelancer", "reddit", "github"] as const;
const STAGED_SOURCES = ["freelancer", "reddit", "github"] as const;

export default async function ScrapedLeadsReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; skip?: string }>;
}) {
  const sp = await searchParams;
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

  const sourceFilter = sanitizeToken(sp.source, 32)?.toLowerCase() ?? null;
  const skipFilter = sanitizeToken(sp.skip, 64);

  let query = supabase
    .from("scraped_leads")
    .select("id, source, short_summary, skip_reason, created_at, processed, raw_data, relevance_score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (sourceFilter && (STAGED_SOURCES as readonly string[]).includes(sourceFilter)) {
    query = query.eq("source", sourceFilter);
  }
  if (skipFilter) {
    query = query.ilike("skip_reason", `%${skipFilter}%`);
  }

  const { data: rows, error } = await query;

  const filterHref = (patch: { source?: string; skip?: string }) => {
    const p = new URLSearchParams();
    if (patch.source && patch.source !== "all") p.set("source", patch.source);
    if (patch.skip) p.set("skip", patch.skip);
    const qs = p.toString();
    return qs ? `/integrations/scraped?${qs}` : "/integrations/scraped";
  };

  const canManualPromote = (row: ScrapedRow) => {
    const sr = row.skip_reason ?? "";
    if (!row.processed) return false;
    if (sr.includes("Promoted to Leads")) return false;
    if (sr.includes("Manually promoted")) return false;
    return true;
  };

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Scraped leads" subtitle="Review-only staging from imports" displayCurrency={displayCurrency} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Rows land here first; promotion uses relevance scoring.{" "}
                <Link href="/leads" className="font-medium text-primary underline-offset-4 hover:underline">
                  Leads
                </Link>
                {" · "}
                <Link href="/integrations" className="font-medium text-primary underline-offset-4 hover:underline">
                  Integrations
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Source:</span>
              {SOURCE_LINKS.map((s) => (
                <Link
                  key={s}
                  href={filterHref({ source: s === "all" ? undefined : s, skip: skipFilter ?? undefined })}
                  className={cn(
                    "rounded-md border px-2.5 py-1 font-medium transition-colors",
                    (s === "all" && !sourceFilter) || (s !== "all" && sourceFilter === s)
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {s}
                </Link>
              ))}
              <span className="mx-1 text-border">|</span>
              <Link
                href={filterHref({ source: sourceFilter ?? undefined, skip: "relevance" })}
                className={cn(
                  "rounded-md border px-2.5 py-1 font-medium transition-colors",
                  skipFilter === "relevance"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                )}
              >
                Skip ~ relevance
              </Link>
              <Link
                href={filterHref({ source: sourceFilter ?? undefined, skip: undefined })}
                className="rounded-md border border-border px-2.5 py-1 text-muted-foreground hover:bg-muted/30"
              >
                Clear skip filter
              </Link>
            </div>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error.message}
              </p>
            ) : !rows?.length ? (
              <div className="rounded-2xl border border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
                No scraped rows match these filters.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-3">Title</th>
                        <th className="px-3 py-3">Source</th>
                        <th className="px-3 py-3">Summary</th>
                        <th className="px-3 py-3">Score</th>
                        <th className="px-3 py-3">Skip reason</th>
                        <th className="px-3 py-3 text-right">Created</th>
                        <th className="px-3 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(rows as ScrapedRow[]).map((row) => (
                        <tr key={row.id} className="align-top hover:bg-muted/15">
                          <td className="max-w-[180px] px-3 py-3 font-medium text-foreground">{listingTitle(row)}</td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs">
                              {platformLabel(row.source)}
                            </span>
                          </td>
                          <td className="max-w-[220px] px-3 py-3 text-muted-foreground">
                            <span className="line-clamp-3 text-xs leading-snug">{rawSnippet(row)}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted-foreground">
                            {row.relevance_score != null && Number.isFinite(Number(row.relevance_score))
                              ? Number(row.relevance_score).toFixed(0)
                              : "—"}
                          </td>
                          <td className="max-w-[200px] px-3 py-3 text-muted-foreground">
                            {row.skip_reason?.trim() ? (
                              <span className="line-clamp-3 text-xs leading-snug">{row.skip_reason}</span>
                            ) : row.processed ? (
                              "—"
                            ) : (
                              <span className="text-xs italic">Pending</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-xs tabular-nums text-muted-foreground">
                            {new Date(row.created_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <ScrapedPromoteButton scrapedId={row.id} disabled={!canManualPromote(row)} />
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
