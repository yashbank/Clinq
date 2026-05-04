import { parseProposalEvaluation } from "@/lib/proposal/parse-evaluation";
import type { DashboardRecentLead, DashboardRecentProposal } from "@/lib/dashboard-stats";

export type DashboardRecommendation = {
  id: string;
  title: string;
  detail: string;
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
    detail: `${top.client_name} (${top.score}) — review brief and decide if you want to invest proposal time.`,
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
        href: "/leads",
      };
    }
  }
  return null;
}

export function buildDashboardRecommendations(args: {
  recentLeads: DashboardRecentLead[];
  recentProposals: Array<DashboardRecentProposal & { evaluation?: unknown }>;
  profileQualityScore: number | null;
}): DashboardRecommendation[] {
  const out: DashboardRecommendation[] = [];
  const seen = new Set<string>();
  const push = (r: DashboardRecommendation | null) => {
    if (!r || seen.has(r.id)) return;
    seen.add(r.id);
    out.push(r);
  };
  push(bestPrioritizeLead(args.recentLeads));
  push(highestPotential(args.recentLeads));
  push(proposalNeedsWork(args.recentProposals));
  push(profileStrength(args.profileQualityScore));
  push(followUpLead(args.recentLeads));
  return out.slice(0, 5);
}
