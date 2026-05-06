import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { ScrapedLeadsInteractiveSection, type ScrapedInteractiveRow } from "@/components/integrations/scraped-leads-interactive-section";
import { ProfileCompletenessBanner } from "@/components/profile/profile-completeness-banner";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { assessProfileCompleteness } from "@/lib/profile/profile-completeness";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { skipReasonChips } from "@/lib/leads/scraped-skip-chips";
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
  dismissed_at: string | null;
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

function skipIndicatesPromoted(skipReason: string | null | undefined): boolean {
  const s = (skipReason ?? "").toLowerCase();
  return s.includes("promoted to leads") || s.includes("manually promoted");
}

function isDismissedRow(row: ScrapedRow): boolean {
  if (row.dismissed_at) return true;
  return (row.skip_reason ?? "").toLowerCase().startsWith("dismissed");
}

const SOURCE_LINKS = ["all", "freelancer", "reddit", "github"] as const;
const STAGED_SOURCES = ["freelancer", "reddit", "github"] as const;
const STATE_LINKS = ["queue", "pending", "promoted", "skipped", "dismissed", "all"] as const;
type StateFilter = (typeof STATE_LINKS)[number];

export const metadata: Metadata = {
  title: "Scraped leads",
};

export default async function ScrapedLeadsReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; skip?: string; state?: string; minScore?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const profileForGate = await loadFreelancerProfileForAi(supabase, user.id);
  const profileCompleteness = assessProfileCompleteness(profileForGate);

  const { data: profRow } = await supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle();
  const displayCurrency =
    typeof profRow?.preferred_currency === "string" && profRow.preferred_currency.trim()
      ? profRow.preferred_currency.trim()
      : "USD";

  const sourceFilter = sanitizeToken(sp.source, 32)?.toLowerCase() ?? null;
  const skipFilter = sanitizeToken(sp.skip, 64);
  const stateRaw = sanitizeToken(sp.state, 24)?.toLowerCase() ?? null;
  const stateFilter: StateFilter = STATE_LINKS.includes(stateRaw as StateFilter) ? (stateRaw as StateFilter) : "queue";
  const minScoreRaw = sp.minScore?.trim() ?? "";
  const minScoreN = /^\d+$/.test(minScoreRaw) ? Math.min(100, Math.max(0, parseInt(minScoreRaw, 10))) : null;

  let query = supabase
    .from("scraped_leads")
    .select("id, source, short_summary, skip_reason, created_at, processed, raw_data, relevance_score, dismissed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(250);

  if (sourceFilter && (STAGED_SOURCES as readonly string[]).includes(sourceFilter)) {
    query = query.eq("source", sourceFilter);
  }
  if (skipFilter) {
    query = query.ilike("skip_reason", `%${skipFilter}%`);
  }
  if (minScoreN != null) {
    query = query.gte("relevance_score", minScoreN);
  }

  if (stateFilter === "queue") {
    query = query.is("dismissed_at", null);
  } else if (stateFilter === "dismissed") {
    query = query.not("dismissed_at", "is", null);
  } else if (stateFilter === "pending" || stateFilter === "promoted" || stateFilter === "skipped") {
    query = query.is("dismissed_at", null);
  }
  // "all" — include dismissed and active

  const { data: rowsRaw, error } = await query;
  let rows = (rowsRaw ?? []) as ScrapedRow[];

  if (stateFilter === "pending") {
    rows = rows.filter((r) => !r.processed && !isDismissedRow(r));
  } else if (stateFilter === "promoted") {
    rows = rows.filter((r) => skipIndicatesPromoted(r.skip_reason));
  } else if (stateFilter === "skipped") {
    rows = rows.filter((r) => r.processed && !skipIndicatesPromoted(r.skip_reason) && !isDismissedRow(r));
  } else if (stateFilter === "queue") {
    rows = rows.filter((r) => !isDismissedRow(r));
  } else if (stateFilter === "dismissed") {
    rows = rows.filter((r) => isDismissedRow(r));
  }

  const filterHref = (patch: { source?: string; skip?: string; state?: string; minScore?: string | null }) => {
    const p = new URLSearchParams();
    if (patch.source && patch.source !== "all") p.set("source", patch.source);
    if (patch.skip) p.set("skip", patch.skip);
    if (patch.state && patch.state !== "queue") p.set("state", patch.state);
    if (patch.minScore != null && patch.minScore !== "") p.set("minScore", patch.minScore);
    const qs = p.toString();
    return qs ? `/integrations/scraped?${qs}` : "/integrations/scraped";
  };

  const canManualPromote = (row: ScrapedRow) => {
    if (isDismissedRow(row)) return false;
    const sr = row.skip_reason ?? "";
    if (!row.processed) return false;
    if (sr.includes("Promoted to Leads")) return false;
    if (sr.includes("Manually promoted")) return false;
    return true;
  };

  const canDismiss = (row: ScrapedRow) => !isDismissedRow(row);

  const interactiveRows: ScrapedInteractiveRow[] = rows.map((row) => {
    const rel = row.relevance_score != null && Number.isFinite(Number(row.relevance_score)) ? Number(row.relevance_score) : null;
    const worthReview =
      row.processed && !skipIndicatesPromoted(row.skip_reason) && !isDismissedRow(row) && rel != null && rel >= 62;
    return {
      id: row.id,
      source: platformLabel(row.source),
      title: listingTitle(row),
      summary: rawSnippet(row),
      skipReason: row.skip_reason?.trim() ? row.skip_reason : row.processed ? "—" : "Pending",
      skipChips: skipReasonChips(row.skip_reason),
      scoreLabel: rel != null ? rel.toFixed(0) : "—",
      createdLabel: new Date(row.created_at).toLocaleString(),
      canPromote: canManualPromote(row),
      canDismiss: canDismiss(row),
      worthReview,
    };
  });

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Scraped leads" subtitle="Review-only staging from imports" displayCurrency={displayCurrency} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <ProfileCompletenessBanner assessment={profileCompleteness} />
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
                  href={filterHref({
                    source: s === "all" ? undefined : s,
                    skip: skipFilter ?? undefined,
                    state: stateFilter === "queue" ? undefined : stateFilter,
                    minScore: minScoreN != null ? String(minScoreN) : null,
                  })}
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
              <span className="text-muted-foreground">State:</span>
              {STATE_LINKS.map((st) => (
                <Link
                  key={st}
                  href={filterHref({
                    source: sourceFilter ?? undefined,
                    skip: skipFilter ?? undefined,
                    state: st === "queue" ? undefined : st,
                    minScore: minScoreN != null ? String(minScoreN) : null,
                  })}
                  className={cn(
                    "rounded-md border px-2 py-1 font-medium capitalize transition-colors",
                    stateFilter === st ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {st}
                </Link>
              ))}
              <span className="mx-1 text-border">|</span>
              <Link
                href={filterHref({
                  source: sourceFilter ?? undefined,
                  skip: "relevance",
                  state: stateFilter === "queue" ? undefined : stateFilter,
                  minScore: minScoreN != null ? String(minScoreN) : null,
                })}
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
                href={filterHref({
                  source: sourceFilter ?? undefined,
                  skip: undefined,
                  state: stateFilter === "queue" ? undefined : stateFilter,
                  minScore: "62",
                })}
                className={cn(
                  "rounded-md border px-2.5 py-1 font-medium transition-colors",
                  minScoreN === 62 ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                )}
              >
                Score ≥ 62
              </Link>
              <Link
                href={filterHref({ source: sourceFilter ?? undefined, skip: undefined, state: undefined, minScore: null })}
                className="rounded-md border border-border px-2.5 py-1 text-muted-foreground hover:bg-muted/30"
              >
                Reset filters
              </Link>
            </div>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error.message}
              </p>
            ) : !rows.length ? (
              <div className="rounded-2xl border border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
                No scraped rows match these filters.
              </div>
            ) : (
              <ScrapedLeadsInteractiveSection rows={interactiveRows} />
            )}
          </div>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
