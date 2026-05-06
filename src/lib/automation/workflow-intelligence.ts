import { computeLeadPriorityScore } from "@/lib/ai/lead-priority";
import { mergeUsdToForeignRates } from "@/lib/currency/display-currency";
import { canonicalLeadProjectTitle } from "@/lib/leads/canonical-lead-display";
import { resolveTrustedBudgetUsd } from "@/lib/currency/budget-evidence";
import { computeLeadFreelancerMatch } from "@/lib/leads/lead-freelancer-match";
import type { FeedbackSignalsSummary } from "@/lib/opportunity/feedback-signals";
import { parseProposalEvaluation } from "@/lib/proposal/parse-evaluation";
import type { LeadRow } from "@/types/database";

const MS_DAY = 86_400_000;
const MS_H = 3_600_000;
/** No thread touch — follow-up nudge window. */
const FOLLOW_UP_STALE_MS = 2.5 * MS_DAY;
/** High score, no proposal — “missed” urgency. */
const MISSED_STALE_MS = 4 * MS_DAY;
/** Saved too long — mid-tier scores. */
const SAVED_LINGER_MS = 7 * MS_DAY;
/** Stale strong saved — higher bar, longer quiet. */
const STALE_STRONG_SAVED_MS = 10 * MS_DAY;
/** Proposal exists but no reminder — wait at least this long after last touch. */
const PROPOSAL_THREAD_REMINDER_MS = 48 * MS_H;

export type WorkflowSuggestionKind =
  | "draft_proposal"
  | "thread_follow_up"
  | "proposal_thread_reminder"
  | "stale_strong_saved"
  | "saved_sitting"
  | "missed_high_score"
  | "review_skipped_scrapes"
  | "tighten_proposal";

export type WorkflowSuggestion = {
  /** Stable id for client dismiss (e.g. `draft_proposal:uuid`). */
  id: string;
  kind: WorkflowSuggestionKind;
  priority: number;
  /** Short headline for queues. */
  title: string;
  /** One-line factual reason. */
  why: string;
  leadId?: string;
  proposalId?: string;
  /** Primary navigation target. */
  href: string;
  /** User can hide from lists (client-only persistence). */
  dismissable: boolean;
};

type ProposalLite = {
  id: string;
  lead_id: string | null;
  title: string | null;
  created_at: string;
  evaluation?: unknown;
};

type ActivityLite = { lead_id: string | null; created_at: string };

export type WorkflowIntelligenceInput = {
  leads: LeadRow[];
  proposals: ProposalLite[];
  activities: ActivityLite[];
  leadIdsWithProposal: Set<string>;
  feedbackSummary?: FeedbackSignalsSummary | null;
  freelancerProfile?: { skills: string[]; techStack: string[]; niches: string[] } | null;
  usdToForeignRates?: Record<string, number> | null;
  /** From scraped review queue (processed, high relevance, not promoted). */
  scrapedHighRelevanceSkipped?: number;
  /** Defaults to `Date.now()`; override in tests. */
  nowMs?: number;
};

function leadTitle(lead: LeadRow): string {
  return canonicalLeadProjectTitle(lead).slice(0, 72);
}

function buildActivityLatestMap(activities: ActivityLite[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of activities) {
    const lid = a.lead_id;
    if (!lid) continue;
    const t = new Date(a.created_at).getTime();
    if (!Number.isFinite(t)) continue;
    const prev = m.get(lid);
    if (prev == null || t > prev) m.set(lid, t);
  }
  return m;
}

function lastTouchMs(lead: LeadRow, activityLatestByLead: Map<string, number>): number {
  const fromAct = lead.id ? activityLatestByLead.get(lead.id) : undefined;
  const updated = new Date(lead.updated_at).getTime();
  if (fromAct != null && Number.isFinite(fromAct)) {
    return Math.max(fromAct, updated);
  }
  return Number.isFinite(updated) ? updated : 0;
}

function recencyTieMs(lead: LeadRow): number {
  const u = new Date(lead.updated_at).getTime();
  return Number.isFinite(u) ? u : 0;
}

function proposalRecencyMs(p: ProposalLite): number {
  const t = new Date(p.created_at).getTime();
  return Number.isFinite(t) ? t : 0;
}

type Scored = WorkflowSuggestion & { _tie: number };

function pickBestPerLeadId(items: Scored[]): Scored[] {
  const m = new Map<string, Scored>();
  for (const it of items) {
    const lid = it.leadId;
    if (!lid) continue;
    const prev = m.get(lid);
    if (!prev || it.priority > prev.priority || (it.priority === prev.priority && it._tie > prev._tie)) {
      m.set(lid, it);
    }
  }
  return [...m.values()];
}

function pickBestPerProposalId(items: Scored[]): Scored[] {
  const m = new Map<string, Scored>();
  for (const it of items) {
    const pid = it.proposalId;
    if (!pid) continue;
    const prev = m.get(pid);
    if (!prev || it.priority > prev.priority || (it.priority === prev.priority && it._tie > prev._tie)) {
      m.set(pid, it);
    }
  }
  return [...m.values()];
}

/**
 * Deterministic workflow / reminder suggestions from real leads, proposals, activities, and imports.
 * No scheduling, no outbound sends — intelligence only.
 */
export function buildWorkflowSuggestions(input: WorkflowIntelligenceInput): WorkflowSuggestion[] {
  const now = input.nowMs ?? Date.now();
  const {
    leads,
    proposals,
    activities,
    leadIdsWithProposal,
    feedbackSummary,
    freelancerProfile,
    usdToForeignRates,
    scrapedHighRelevanceSkipped = 0,
  } = input;

  const mergedFx = mergeUsdToForeignRates(usdToForeignRates ?? null);
  const activityLatestByLead = buildActivityLatestMap(activities);
  const rankingTokens = freelancerProfile
    ? [
        ...new Set(
          [...freelancerProfile.skills, ...freelancerProfile.techStack, ...freelancerProfile.niches]
            .map((s) => String(s).trim().toLowerCase())
            .filter((s) => s.length > 1),
        ),
      ].slice(0, 80)
    : [];

  const leadScoped: Scored[] = [];

  for (const lead of leads) {
    if (lead.deleted_at || lead.archived_at) continue;

    const hasProposal = leadIdsWithProposal.has(lead.id);
    let matchSkill: number | undefined;
    let matchNiche: number | undefined;
    if (freelancerProfile) {
      const m = computeLeadFreelancerMatch(lead, freelancerProfile);
      matchSkill = m.skillMatchPct;
      matchNiche = m.nicheMatchPct;
    }
    const effectiveUsd = resolveTrustedBudgetUsd(lead, mergedFx);
    const openFu = feedbackSummary?.openFollowUpsByLeadId.get(lead.id) ?? 0;
    const priorityScore = computeLeadPriorityScore(lead, {
      feedbackSummary: feedbackSummary ?? undefined,
      openFollowUpCount: openFu,
      skillMatchPct: matchSkill,
      nicheMatchPct: matchNiche,
      effectiveBudgetUsd: effectiveUsd,
      profileTokens: rankingTokens.length > 0 ? rankingTokens : undefined,
      hasProposal,
    });

    const lastTouch = lastTouchMs(lead, activityLatestByLead);
    const ageMs = now - lastTouch;
    const title = leadTitle(lead);
    const score = Number(lead.score) || 0;
    const stage = lead.stage;

    const highValueNoProposal =
      !hasProposal &&
      (stage === "saved" || stage === "applied") &&
      (priorityScore >= 75 || (score >= 72 && (effectiveUsd ?? 0) >= 1500));

    if (highValueNoProposal) {
      leadScoped.push({
        id: `draft_proposal:${lead.id}`,
        kind: "draft_proposal",
        priority: 84 + Math.min(12, priorityScore - 72),
        title,
        why: `Priority ${priorityScore} with no proposal on file — draft while context is fresh.`,
        leadId: lead.id,
        href: `/proposals?leadId=${encodeURIComponent(lead.id)}`,
        dismissable: true,
        _tie: recencyTieMs(lead),
      });
    }

    if ((stage === "replied" || stage === "interview") && !hasProposal && ageMs >= FOLLOW_UP_STALE_MS) {
      leadScoped.push({
        id: `thread_follow_up:${lead.id}`,
        kind: "thread_follow_up",
        priority: 69 + (stage === "interview" ? 5 : 0),
        title,
        why: "Thread quiet for a few days and no proposal logged — reply or capture your angle.",
        leadId: lead.id,
        href: `/leads?q=${encodeURIComponent(title)}`,
        dismissable: true,
        _tie: recencyTieMs(lead),
      });
    }

    if (
      (stage === "replied" || stage === "interview" || stage === "active") &&
      hasProposal &&
      openFu < 1 &&
      ageMs >= PROPOSAL_THREAD_REMINDER_MS
    ) {
      leadScoped.push({
        id: `proposal_thread_reminder:${lead.id}`,
        kind: "proposal_thread_reminder",
        priority: 71 + (stage === "active" ? 3 : 0),
        title,
        why: "Proposal exists but no open follow-up reminder — add one so the thread does not stall.",
        leadId: lead.id,
        href: `/follow-ups`,
        dismissable: true,
        _tie: recencyTieMs(lead),
      });
    }

    if (stage === "saved" && !hasProposal && score >= 74 && ageMs >= STALE_STRONG_SAVED_MS) {
      leadScoped.push({
        id: `stale_strong_saved:${lead.id}`,
        kind: "stale_strong_saved",
        priority: 86 + Math.min(8, score - 74),
        title,
        why: `Score ${score} but still in Saved with no proposal after 10+ quiet days — decide or draft.`,
        leadId: lead.id,
        href: `/leads?q=${encodeURIComponent(title)}`,
        dismissable: true,
        _tie: recencyTieMs(lead),
      });
    }

    if (stage === "saved" && !hasProposal && score >= 60 && score < 80 && ageMs >= SAVED_LINGER_MS) {
      leadScoped.push({
        id: `saved_sitting:${lead.id}`,
        kind: "saved_sitting",
        priority: 62 + Math.min(10, score - 60),
        title,
        why: "In Saved over a week without movement — triage or archive to keep the queue honest.",
        leadId: lead.id,
        href: `/leads?q=${encodeURIComponent(title)}`,
        dismissable: true,
        _tie: recencyTieMs(lead),
      });
    }

    if (!hasProposal && score >= 80 && ageMs >= MISSED_STALE_MS) {
      leadScoped.push({
        id: `missed_high_score:${lead.id}`,
        kind: "missed_high_score",
        priority: 90 + Math.min(8, score - 80),
        title,
        why: `Score ${score} with several quiet days and no proposal — worth a focused pass.`,
        leadId: lead.id,
        href: `/proposals?leadId=${encodeURIComponent(lead.id)}`,
        dismissable: true,
        _tie: recencyTieMs(lead),
      });
    }
  }

  const bestPerLead = pickBestPerLeadId(leadScoped);

  const proposalScoped: Scored[] = [];
  for (const p of proposals) {
    const ev = parseProposalEvaluation(p.evaluation);
    if (ev && ev.overall < 60) {
      proposalScoped.push({
        id: `tighten_proposal:${p.id}`,
        kind: "tighten_proposal",
        priority: 57 + Math.max(0, 60 - ev.overall),
        title: (p.title ?? "Proposal").slice(0, 56),
        why: `Last evaluation ${ev.overall}/100 — tighten proof and CTA before sending.`,
        leadId: p.lead_id ?? undefined,
        proposalId: p.id,
        href: p.lead_id ? `/proposals?leadId=${encodeURIComponent(p.lead_id)}` : "/proposals",
        dismissable: true,
        _tie: proposalRecencyMs(p),
      });
    }
  }
  const bestPerProposal = pickBestPerProposalId(proposalScoped);

  const queue: Scored[] = [...bestPerLead, ...bestPerProposal];

  if (scrapedHighRelevanceSkipped > 0) {
    queue.push({
      id: "review_skipped_scrapes:queue",
      kind: "review_skipped_scrapes",
      priority: 64,
      title: "Scraped queue",
      why: `${scrapedHighRelevanceSkipped} high-relevance row(s) were skipped — quick review may surface a fit.`,
      href: "/integrations/scraped?state=skipped&minScore=62",
      dismissable: true,
      _tie: now,
    });
  }

  queue.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b._tie - a._tie;
  });

  return queue.map((item) => {
    const { _tie, ...rest } = item;
    void _tie;
    return rest;
  });
}
