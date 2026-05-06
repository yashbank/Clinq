import { computeLeadPriorityScore } from "@/lib/ai/lead-priority";
import { parseProposalEvaluation } from "@/lib/proposal/parse-evaluation";
import type { LeadRow } from "@/types/database";

export type DailyActionType = "apply" | "follow_up" | "improve_proposal" | "missed_opportunity";

export type DailyAction = {
  type: DailyActionType;
  priority: number;
  reason: string;
  leadId?: string;
  proposalId?: string;
};

type ProposalInput = {
  id: string;
  lead_id: string | null;
  title: string | null;
  created_at: string;
  evaluation?: unknown;
};

type ActivityInput = {
  lead_id: string | null;
  created_at: string;
};

const MS_DAY = 86_400_000;
/** Middle of “2–3 days” — no touch on this lead recently. */
const FOLLOW_UP_STALE_MS = 2.5 * MS_DAY;
/** Middle of “3–5 days” — high-score lead going quiet without a proposal. */
const MISSED_STALE_MS = 4 * MS_DAY;

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

function proposalRecencyMs(p: ProposalInput): number {
  const t = new Date(p.created_at).getTime();
  return Number.isFinite(t) ? t : 0;
}

function buildActivityLatestMap(activities: ActivityInput[]): Map<string, number> {
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

type ScoredAction = DailyAction & { _tie: number };

function pickBestPerKey(actions: ScoredAction[], keyFn: (a: ScoredAction) => string | null): ScoredAction[] {
  const m = new Map<string, ScoredAction>();
  for (const a of actions) {
    const k = keyFn(a);
    if (k == null) continue;
    const prev = m.get(k);
    if (!prev || a.priority > prev.priority || (a.priority === prev.priority && a._tie > prev._tie)) {
      m.set(k, a);
    }
  }
  return [...m.values()];
}

/**
 * Deterministic daily command list from real leads, proposals, and activities (no AI).
 */
export function buildDailyActions(args: {
  leads: LeadRow[];
  proposals: ProposalInput[];
  activities: ActivityInput[];
  leadIdsWithProposal: Set<string>;
}): DailyAction[] {
  const { leads, proposals, activities, leadIdsWithProposal } = args;
  const now = Date.now();
  const activityLatestByLead = buildActivityLatestMap(activities);

  const leadScoped: ScoredAction[] = [];

  for (const lead of leads) {
    if (lead.deleted_at || lead.archived_at) continue;

    const hasProposal = leadIdsWithProposal.has(lead.id);
    const priorityScore = computeLeadPriorityScore(lead);
    const lastTouch = lastTouchMs(lead, activityLatestByLead);
    const staleForFollowUp = now - lastTouch >= FOLLOW_UP_STALE_MS;
    const staleForMissed = now - lastTouch >= MISSED_STALE_MS;

    if (lead.stage === "saved" && !hasProposal && priorityScore >= 75) {
      leadScoped.push({
        type: "apply",
        priority: 82 + Math.min(12, priorityScore - 75),
        reason: `Priority score ${priorityScore} and no proposal logged for this lead yet.`,
        leadId: lead.id,
        _tie: recencyTieMs(lead),
      });
    }

    if ((lead.stage === "replied" || lead.stage === "interview") && staleForFollowUp) {
      leadScoped.push({
        type: "follow_up",
        priority: 68 + (lead.stage === "interview" ? 4 : 0),
        reason: "No activity on this thread in the last few days — worth a nudge.",
        leadId: lead.id,
        _tie: recencyTieMs(lead),
      });
    }

    if (!hasProposal && lead.score >= 80 && staleForMissed) {
      leadScoped.push({
        type: "missed_opportunity",
        priority: 88 + Math.min(10, lead.score - 80),
        reason: `Score ${lead.score} but quiet for several days with no proposal on file.`,
        leadId: lead.id,
        _tie: recencyTieMs(lead),
      });
    }
  }

  const bestPerLead = pickBestPerKey(leadScoped, (a) => a.leadId ?? null);

  const proposalScoped: ScoredAction[] = [];
  for (const p of proposals) {
    const ev = parseProposalEvaluation(p.evaluation);
    if (ev && ev.overall < 60) {
      proposalScoped.push({
        type: "improve_proposal",
        priority: 58 + Math.max(0, 60 - ev.overall),
        reason: `Last evaluation overall ${ev.overall}/100 — tighten clarity and proof before sending.`,
        leadId: p.lead_id ?? undefined,
        proposalId: p.id,
        _tie: proposalRecencyMs(p),
      });
    }
  }

  const bestPerProposal = pickBestPerKey(proposalScoped, (a) => a.proposalId ?? null);

  const merged = [...bestPerLead, ...bestPerProposal];
  merged.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b._tie - a._tie;
  });

  return merged.slice(0, 6).map((a) => {
    const out: DailyAction = {
      type: a.type,
      priority: a.priority,
      reason: a.reason,
    };
    if (a.leadId) out.leadId = a.leadId;
    if (a.proposalId) out.proposalId = a.proposalId;
    return out;
  });
}
