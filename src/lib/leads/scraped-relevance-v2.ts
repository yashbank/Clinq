import "server-only";

import { computeLeadFreelancerMatch } from "@/lib/leads/lead-freelancer-match";
import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import type { LeadRow } from "@/types/database";

export type ProfileSnapV2 = {
  skills: string[];
  niches: string[];
  tech_stack: string[];
};

const PROMOTE_THRESHOLD = 47;

function importTagsFromMetadata(metadataExtra: Record<string, unknown>): string[] {
  const imp = metadataExtra.import;
  if (!imp || typeof imp !== "object" || Array.isArray(imp)) return [];
  const tags = (imp as Record<string, unknown>).tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim());
}

function keywordOverlapScore(input: CreateLeadInput, profile: ProfileSnapV2, listingTags: string[]): number {
  const hay = `${input.project_title ?? ""} ${input.project_description ?? ""}`.toLowerCase();
  const profileKeys = [...profile.skills, ...profile.tech_stack, ...profile.niches]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2);
  const tagKeys = listingTags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 1);

  let score = 0;
  for (const k of tagKeys) {
    if (hay.includes(k)) score += 4;
  }
  const seen = new Set<string>();
  for (const k of profileKeys) {
    if (!hay.includes(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    score += k.length >= 6 ? 3 : 2;
  }
  return Math.min(26, score);
}

function titleOverlapScore(input: CreateLeadInput, profile: ProfileSnapV2): number {
  const title = (input.project_title ?? "").toLowerCase().trim();
  if (title.length < 6) return 0;

  const profileTerms = [...profile.skills, ...profile.niches, ...profile.tech_stack]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2);

  const profileWordSet = new Set(profileTerms.flatMap((s) => s.split(/\W+/).filter((w) => w.length > 2)));
  const titleWords = [...new Set(title.split(/\W+/).filter((w) => w.length > 2))];
  let overlap = 0;
  for (const w of titleWords) {
    if (profileWordSet.has(w)) overlap += 1;
  }
  let s = Math.min(14, overlap * 4);
  for (const sk of [...profile.skills, ...profile.tech_stack]) {
    const x = sk.trim().toLowerCase();
    if (x.length >= 4 && title.includes(x)) s += 4;
  }
  return Math.min(22, s);
}

function nicheBodyScore(input: CreateLeadInput, profile: ProfileSnapV2): number {
  const body = (input.project_description ?? "").toLowerCase();
  if (body.length < 20) return 0;
  let n = 0;
  for (const niche of profile.niches) {
    const t = niche.trim().toLowerCase();
    if (t.length > 2 && body.includes(t)) n += 3;
  }
  return Math.min(16, n);
}

function budgetSanityScore(input: CreateLeadInput): number {
  const b = input.budget;
  if (b == null || !Number.isFinite(b) || b <= 0) return 0;
  if (b > 0 && b < 500_000) return 8;
  return 4;
}

function sourceQualityPoints(source: string): number {
  const s = source.toLowerCase();
  if (s.includes("freelancer")) return 12;
  if (s.includes("github")) return 8;
  if (s.includes("reddit")) return 6;
  return 5;
}

function negativeSignals(input: CreateLeadInput): number {
  let penalty = 0;
  const body = (input.project_description ?? "").toLowerCase();
  const title = (input.project_title ?? "").toLowerCase();
  if (body.includes("[removed]") || body.includes("[deleted]")) penalty += 18;
  if (title.length < 10) penalty += 6;
  if (body.length > 0 && body.length < 35) penalty += 5;
  const spam = ["click here", "crypto airdrop", "whatsapp only", "telegram only"];
  for (const x of spam) {
    if (body.includes(x) || title.includes(x)) penalty += 12;
  }
  return penalty;
}

export type RelevanceV2Result = {
  score: number;
  promote: boolean;
  skipReasons: string[];
  breakdown: Record<string, number>;
};

/**
 * Deterministic relevance scoring for scraped-row promotion (no LLM).
 */
export function computeScrapedRelevanceV2(args: {
  input: CreateLeadInput;
  profile: ProfileSnapV2;
  metadataExtra: Record<string, unknown>;
  synth: LeadRow;
  source: string;
}): RelevanceV2Result {
  const { input, profile, metadataExtra, synth, source } = args;
  const tags = importTagsFromMetadata(metadataExtra);

  const kw = keywordOverlapScore(input, profile, tags);
  const title = titleOverlapScore(input, profile);
  const niche = nicheBodyScore(input, profile);
  const budget = budgetSanityScore(input);
  const srcPts = sourceQualityPoints(source);
  const { skillMatchPct } = computeLeadFreelancerMatch(synth, {
    skills: profile.skills,
    niches: profile.niches,
    techStack: profile.tech_stack,
  });
  const skillPts = Math.round(Math.min(30, (skillMatchPct / 100) * 30));

  const neg = negativeSignals(input);

  const rawTotal = kw + title + niche + budget + srcPts + skillPts - neg;
  const score = Math.max(0, Math.min(100, Math.round(rawTotal)));

  const breakdown: Record<string, number> = {
    keyword_tag: kw,
    title: title,
    niche_body: niche,
    budget: budget,
    source: srcPts,
    skill: skillPts,
    negative: -neg,
  };

  const skipReasons: string[] = [];
  if (skillPts < 6) skipReasons.push("Low skill overlap vs profile");
  if (title + kw < 8) skipReasons.push("Weak title/keyword match");
  if (neg >= 12) skipReasons.push("Negative content signals");

  const promote = score >= PROMOTE_THRESHOLD && neg < 18;

  return { score, promote, skipReasons, breakdown };
}

export function formatRelevanceSkipReason(result: RelevanceV2Result): string {
  const base = `Relevance ${result.score}/${100} (threshold ${PROMOTE_THRESHOLD})`;
  if (result.skipReasons.length === 0) return `${base}.`;
  return `${base}. ${result.skipReasons.slice(0, 3).join(" · ")}`;
}
