import { parseProposalEvaluation } from "@/lib/proposal/parse-evaluation";
import type { DashboardRecentLead, DashboardRecentProposal } from "@/lib/dashboard-stats";

export type DashboardRecommendation = {
  id: string;
  title: string;
  detail: string;
  /** Short evidence line — real signals from your data only. */
  why?: string;
  href: string;
};

const MS_DAY = 86_400_000;

function bestPrioritizeLead(leads: DashboardRecentLead[]): DashboardRecommendation | null {
  const pool = leads.filter((l) => l.stage === "saved" || l.stage === "applied" || l.stage === "replied");
  if (!pool.length) return null;
  const top = [...pool].sort((a, b) => b.score - a.score)[0];
  if (top.score < 35) return null;
  return {
    id: "prioritize-lead",
    title: "Best lead to prioritize",
    detail: `${top.client_name} — score ${top.score}, stage ${top.stage}.`,
    why: `Sorted by Clinq score among leads in active stages; ${top.client_name} is currently highest.`,
    href: "/leads",
  };
}

function highestPotential(leads: DashboardRecentLead[]): DashboardRecommendation | null {
  if (!leads.length) return null;
  const top = [...leads].sort((a, b) => b.score - a.score)[0];
  if (top.score < 55) return null;
  return {
    id: "highest-potential",
    title: "Highest-scoring opportunity",
    detail: `${top.client_name} (${top.score}) — review brief before investing proposal time.`,
    why: `Top score in your recent lead list (${top.score}/100).`,
    href: "/leads",
  };
}

function proposalNeedsWork(
  proposals: Array<DashboardRecentProposal & { evaluation?: unknown }>,
): DashboardRecommendation | null {
  for (const p of proposals) {
    const ev = parseProposalEvaluation(p.evaluation);
    if (ev && ev.overall < 58) {
      return {
        id: "proposal-revise",
        title: "Proposal may need tightening",
        detail: `“${(p.title ?? "Proposal").slice(0, 48)}” scored ${ev.overall} overall on the last evaluation—edit in Proposal studio.`,
        why: `Stored evaluation overall is below 58 for this draft.`,
        href: "/proposals",
      };
    }
  }
  return null;
}

function profileStrength(quality: number | null): DashboardRecommendation | null {
  if (quality == null || quality >= 52) return null;
  return {
    id: "profile-strength",
    title: "Profile depth is still light",
    detail: "Add resume text, skills, and niches so lead overlap and proposals stay specific.",
    why: `Profile intelligence quality score is ${quality ?? "low"} (internal parse of your profile fields).`,
    href: "/profile",
  };
}

function followUpLead(leads: DashboardRecentLead[]): DashboardRecommendation | null {
  const now = Date.now();
  for (const l of leads) {
    if (l.stage !== "replied" && l.stage !== "interview") continue;
    const t = new Date(l.updated_at).getTime();
    if (Number.isNaN(t)) continue;
    if (now - t > 5 * MS_DAY) {
      return {
        id: "follow-up",
        title: "Follow-up candidate",
        detail: `${l.client_name} in ${l.stage} — last update ${new Date(l.updated_at).toLocaleDateString()}.`,
        why: `Lead row \`updated_at\` is more than 5 days ago while stage is still ${l.stage}.`,
        href: "/follow-ups",
      };
    }
  }
  return null;
}

function staleSavedLead(leads: DashboardRecentLead[]): DashboardRecommendation | null {
  const now = Date.now();
  const stale = leads.filter((l) => {
    if (l.stage !== "saved") return false;
    const t = new Date(l.updated_at).getTime();
    return !Number.isNaN(t) && now - t > 10 * MS_DAY;
  });
  if (!stale.length) return null;
  const worst = [...stale].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())[0];
  return {
    id: "stale-saved",
    title: "Stale lead in Saved",
    detail: `${worst.client_name} has sat in Saved since ${new Date(worst.updated_at).toLocaleDateString()}—move or drop it.`,
    why: `Stage is “saved” and \`updated_at\` is older than 10 days.`,
    href: "/pipeline",
  };
}

function hotLeadWithoutProposal(
  leads: DashboardRecentLead[],
  proposalLeadIds: Set<string>,
): DashboardRecommendation | null {
  const pool = leads.filter(
    (l) => l.stage === "saved" && l.score >= 68 && l.id && !proposalLeadIds.has(l.id),
  );
  if (!pool.length) return null;
  const top = [...pool].sort((a, b) => b.score - a.score)[0];
  return {
    id: "hot-no-proposal",
    title: "High-score lead — no proposal logged",
    detail: `${top.client_name} (${top.score}) has no linked proposal row yet.`,
    why: `Score ≥ 68 in Saved and no \`proposals.lead_id\` references this lead id.`,
    href: "/proposals",
  };
}

export function buildDashboardRecommendations(args: {
  recentLeads: DashboardRecentLead[];
  recentProposals: Array<DashboardRecentProposal & { evaluation?: unknown }>;
  profileQualityScore: number | null;
  proposalLeadIds: Set<string>;
}): DashboardRecommendation[] {
  const out: DashboardRecommendation[] = [];
  const seen = new Set<string>();
  const push = (r: DashboardRecommendation | null) => {
    if (!r || seen.has(r.id)) return;
    seen.add(r.id);
    out.push(r);
  };
  push(staleSavedLead(args.recentLeads));
  push(hotLeadWithoutProposal(args.recentLeads, args.proposalLeadIds));
  push(bestPrioritizeLead(args.recentLeads));
  push(highestPotential(args.recentLeads));
  push(proposalNeedsWork(args.recentProposals));
  push(profileStrength(args.profileQualityScore));
  push(followUpLead(args.recentLeads));
  return out.slice(0, 6);
}
