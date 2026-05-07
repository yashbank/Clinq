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
import {
  detectScrapedLeadsRelevanceScoreSupport,
  isMissingRelevanceScoreColumnError,
  SCRAPED_LEADS_RELEVANCE_MIGRATION_HINT,
} from "@/lib/scraped-leads/relevance-column";
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

  let supportsRelevanceScore = await detectScrapedLeadsRelevanceScoreSupport(supabase);
  const baseCols = "id, source, short_summary, skip_reason, created_at, processed, raw_data, dismissed_at";
  const selectColumns = supportsRelevanceScore ? `${baseCols}, relevance_score` : baseCols;

  let qb = supabase.from("scraped_leads").select(selectColumns).eq("user_id", user.id).order("created_at", { ascending: false }).limit(250);
  if (sourceFilter && (STAGED_SOURCES as readonly string[]).includes(sourceFilter)) {
    qb = qb.eq("source", sourceFilter);
  }
  if (skipFilter) {
    qb = qb.ilike("skip_reason", `%${skipFilter}%`);
  }
  if (minScoreN != null && supportsRelevanceScore) {
    qb = qb.gte("relevance_score", minScoreN);
  }
  if (stateFilter === "queue") {
    qb = qb.is("dismissed_at", null);
  } else if (stateFilter === "dismissed") {
    qb = qb.not("dismissed_at", "is", null);
  } else if (stateFilter === "pending" || stateFilter === "promoted" || stateFilter === "skipped") {
    qb = qb.is("dismissed_at", null);
  }

  const first = await qb;
  let rowsRaw: Record<string, unknown>[] | null = first.data as Record<string, unknown>[] | null;
  let error = first.error;

  if (error && isMissingRelevanceScoreColumnError(error.message)) {
    supportsRelevanceScore = false;
    let q2 = supabase.from("scraped_leads").select(baseCols).eq("user_id", user.id).order("created_at", { ascending: false }).limit(250);
    if (sourceFilter && (STAGED_SOURCES as readonly string[]).includes(sourceFilter)) {
      q2 = q2.eq("source", sourceFilter);
    }
    if (skipFilter) {
      q2 = q2.ilike("skip_reason", `%${skipFilter}%`);
    }
    if (stateFilter === "queue") {
      q2 = q2.is("dismissed_at", null);
    } else if (stateFilter === "dismissed") {
      q2 = q2.not("dismissed_at", "is", null);
    } else if (stateFilter === "pending" || stateFilter === "promoted" || stateFilter === "skipped") {
      q2 = q2.is("dismissed_at", null);
    }
    const second = await q2;
    rowsRaw = second.data as Record<string, unknown>[] | null;
    error = second.error;
  }

  const minScoreIgnoredBecauseMigration = minScoreN != null && !supportsRelevanceScore;

  let rows = (rowsRaw ?? []).map((r) => {
    const rec = r as Record<string, unknown>;
    const relRaw = rec.relevance_score;
    const relNum = typeof relRaw === "number" && Number.isFinite(relRaw) ? relRaw : null;
    return {
      ...(rec as ScrapedRow),
      relevance_score: supportsRelevanceScore ? relNum : null,
    };
  });

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
        <main className="flex-1 overflow-y-auto p-3 pb-10 sm:p-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <ProfileCompletenessBanner assessment={profileCompleteness} />
            {!supportsRelevanceScore ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
                <p className="font-medium text-amber-950 dark:text-amber-100">Relevance column not available yet</p>
                <p className="mt-1 text-muted-foreground">{SCRAPED_LEADS_RELEVANCE_MIGRATION_HINT}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  You can still review rows; score chips show “—” until migrations are applied.
                </p>
              </div>
            ) : null}
            {minScoreIgnoredBecauseMigration ? (
              <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                Score filters are ignored until the relevance migration is applied (URL still shows your chosen threshold).
              </div>
            ) : null}

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
              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <p className="font-medium text-destructive">
                  {isMissingRelevanceScoreColumnError(error.message)
                    ? "Scraped review needs a quick database update"
                    : "Could not load scraped leads"}
                </p>
                <p className="text-muted-foreground">
                  {isMissingRelevanceScoreColumnError(error.message) ? SCRAPED_LEADS_RELEVANCE_MIGRATION_HINT : error.message}
                </p>
              </div>
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
