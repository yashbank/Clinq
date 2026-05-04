import { analyzeLead } from "@/lib/ai/lead-intelligence";
import type { LeadRow } from "@/types/database";

function tokenize(text: string): Set<string> {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
  return new Set(raw);
}

function normalizeSkill(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Deterministic overlap between saved profile skills/niches and lead brief text.
 * Percentages are indicative (not predictive of revenue).
 */
export function computeLeadFreelancerMatch(
  row: LeadRow,
  freelancer: { skills: string[]; niches: string[]; techStack?: string[] },
): {
  skillMatchPct: number;
  nicheMatchPct: number;
  portfolioAlignmentPct: number;
  proposalStrengthHint: number;
  whyMatch: string[];
  skillReasons: string[];
  warnings: string[];
} {
  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const projectTitle = typeof meta.project_title === "string" ? meta.project_title : "";
  const projectUrl = typeof meta.project_url === "string" ? meta.project_url : "";
  const haystack = `${projectTitle} ${row.project_description ?? ""} ${projectUrl}`.toLowerCase();
  const tokens = tokenize(haystack);

  const skillSet = new Set(
    [...(freelancer.skills ?? []), ...(freelancer.techStack ?? [])].map(normalizeSkill).filter(Boolean),
  );
  const nicheSet = new Set((freelancer.niches ?? []).map(normalizeSkill).filter(Boolean));

  let skillHits = 0;
  const skillReasons: string[] = [];
  for (const sk of skillSet) {
    if (sk.length < 2) continue;
    if (haystack.includes(sk) || [...tokens].some((t) => t.includes(sk) || sk.includes(t))) {
      skillHits += 1;
      if (skillReasons.length < 4) {
        skillReasons.push(`Brief mentions or aligns with “${sk}”.`);
      }
    }
  }
  const skillMatchPct =
    skillSet.size === 0 ? 0 : Math.min(100, Math.round((skillHits / Math.min(skillSet.size, 12)) * 100));

  let nicheHits = 0;
  for (const n of nicheSet) {
    if (n.length < 2) continue;
    if (haystack.includes(n)) nicheHits += 1;
  }
  const nicheMatchPct =
    nicheSet.size === 0 ? 0 : Math.min(100, Math.round((nicheHits / Math.min(nicheSet.size, 8)) * 100));

  const notes = (row.proposal_match_notes ?? "").toLowerCase();
  const matchNotesBoost = notes.length > 40 ? 12 : notes.length > 10 ? 6 : 0;
  const portfolioAlignmentPct = Math.min(
    100,
    Math.round(skillMatchPct * 0.55 + nicheMatchPct * 0.35 + matchNotesBoost + (row.project_quality >= 4 ? 8 : 0)),
  );

  const analyzed = analyzeLead({
    budget: row.budget,
    repeatHire: row.repeat_hire,
    competitionLevel: row.competition_level,
    projectQuality: row.project_quality,
    clientHistory: row.client_history,
    proposalMatchNotes: row.proposal_match_notes,
    projectTitle,
    projectDescription: row.project_description,
    projectUrl,
    platform: row.platform,
  });

  const proposalStrengthHint = Math.min(
    100,
    Math.round(row.score * 0.45 + analyzed.confidence * 0.35 + portfolioAlignmentPct * 0.2),
  );

  const whyMatch: string[] = [];
  if (skillHits > 0) {
    whyMatch.push(`${skillHits} saved skill${skillHits === 1 ? "" : "s"} overlap the brief.`);
  } else if (skillSet.size > 0) {
    whyMatch.push("No direct keyword overlap yet—brief may use different wording than your saved skills.");
  }
  if (nicheHits > 0) {
    whyMatch.push(`${nicheHits} niche tag${nicheHits === 1 ? "" : "s"} appear in the opportunity text.`);
  }
  if (row.repeat_hire) {
    whyMatch.push("Repeat engagement signal on this lead.");
  }
  if (row.project_quality >= 4) {
    whyMatch.push("Brief is relatively clear—easier to anchor a proposal.");
  }
  if (whyMatch.length === 0) {
    whyMatch.push("Match is driven mostly by budget, competition, and brief quality until you add skills and niches.");
  }

  const warnings = [...(analyzed.flags ?? [])];
  if (row.competition_level >= 4) {
    warnings.push("signal: crowded competition on this brief");
  }

  return {
    skillMatchPct,
    nicheMatchPct,
    portfolioAlignmentPct,
    proposalStrengthHint,
    whyMatch: whyMatch.slice(0, 4),
    skillReasons: skillReasons.slice(0, 4),
    warnings: warnings.slice(0, 6),
  };
}
