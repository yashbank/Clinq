import type { ParsedResumeAdvanced } from "@/lib/profile/parse-resume-advanced";
import type { FreelancerProfileFields } from "@/types/profile";

export type ProfileRowForMerge = Pick<
  FreelancerProfileFields,
  | "bio"
  | "skills"
  | "tech_stack"
  | "niches"
  | "portfolio_links"
  | "linkedin_url"
  | "github_url"
  | "website_url"
>;

export type MergeResumeIntoProfileResult = {
  patch: Record<string, unknown>;
  enrichedLabels: string[];
};

function uniqStrings(items: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items.map((x) => x.trim()).filter(Boolean)) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s.slice(0, 2000));
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Merges deterministic resume extraction into profile fields without overwriting strong user data.
 */
export function mergeResumeExtractionIntoProfile(
  current: ProfileRowForMerge,
  extraction: ParsedResumeAdvanced,
): MergeResumeIntoProfileResult {
  const enrichedLabels: string[] = [];
  const patch: Record<string, unknown> = {};

  const curSkills = current.skills ?? [];
  const curTech = current.tech_stack ?? [];
  const curNiches = current.niches ?? [];
  const curLinks = current.portfolio_links ?? [];

  if (extraction.skills.length > 0) {
    const strongSkills = curSkills.filter(Boolean).length >= 6;
    if (strongSkills) {
      const lower = new Set(curSkills.map((s) => s.toLowerCase()));
      const onlyNew = extraction.skills.filter((s) => s.trim() && !lower.has(s.trim().toLowerCase()));
      if (onlyNew.length) {
        patch.skills = uniqStrings([...curSkills, ...onlyNew.slice(0, 12)], 80);
        enrichedLabels.push("skills");
      }
    } else {
      const merged = uniqStrings([...curSkills, ...extraction.skills], 80);
      if (merged.length > curSkills.filter(Boolean).length) {
        patch.skills = merged;
        enrichedLabels.push("skills");
      }
    }
  }

  if (extraction.tech_stack.length > 0) {
    const strongTech = curTech.filter(Boolean).length >= 4;
    if (strongTech) {
      const lower = new Set(curTech.map((s) => s.toLowerCase()));
      const onlyNew = extraction.tech_stack.filter((s) => !lower.has(s.toLowerCase()));
      if (onlyNew.length) {
        patch.tech_stack = uniqStrings([...curTech, ...onlyNew.slice(0, 16)], 80);
        enrichedLabels.push("tech stack");
      }
    } else {
      const merged = uniqStrings([...curTech, ...extraction.tech_stack], 80);
      if (merged.length > curTech.filter(Boolean).length) {
        patch.tech_stack = merged;
        enrichedLabels.push("tech stack");
      }
    }
  }

  if (curNiches.filter(Boolean).length < 1 && extraction.inferred_niches.length > 0) {
    patch.niches = uniqStrings([...curNiches, ...extraction.inferred_niches], 40);
    enrichedLabels.push("niches");
  }

  const bioWeak = (current.bio ?? "").trim().length < 40;
  const draft = (extraction.summary_draft ?? "").trim();
  if (bioWeak && draft.length >= 60) {
    patch.bio = draft.slice(0, 4000);
    enrichedLabels.push("bio");
  }

  if (!(current.linkedin_url ?? "").trim() && extraction.linkedin_url) {
    patch.linkedin_url = extraction.linkedin_url;
    enrichedLabels.push("LinkedIn");
  }
  if (!(current.github_url ?? "").trim() && extraction.github_url) {
    patch.github_url = extraction.github_url;
    enrichedLabels.push("GitHub");
  }
  if (!(current.website_url ?? "").trim() && extraction.website_url) {
    patch.website_url = extraction.website_url;
    enrichedLabels.push("website");
  }

  const linkCount = curLinks.filter(Boolean).length;
  if (extraction.portfolio_urls.length > 0 && linkCount < 4) {
    const mergedLinks = uniqStrings([...curLinks, ...extraction.portfolio_urls], 20);
    if (mergedLinks.length > linkCount) {
      patch.portfolio_links = mergedLinks;
      enrichedLabels.push("portfolio links");
    }
  }

  return { patch, enrichedLabels };
}
