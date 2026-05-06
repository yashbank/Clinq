import type { ParsedResumeAdvanced } from "@/lib/profile/parse-resume-advanced";
import type { FreelancerProfileFields } from "@/types/profile";

function mergeUniqueStrings(existing: string[], incoming: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...existing, ...incoming]) {
    const t = s.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= cap) break;
  }
  return out;
}

function isWeakBio(bio: string | null | undefined): boolean {
  const t = (bio ?? "").trim();
  return t.length < 40;
}

function isBlank(s: string | null | undefined): boolean {
  return !s || !String(s).trim();
}

/**
 * Non-destructive merge: unions lists, fills empty URLs/bio/headline, never removes user data.
 */
export function mergeResumeExtractionIntoProfileUpdate(
  current: FreelancerProfileFields,
  parsed: ParsedResumeAdvanced,
): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {};
  let touched = false;

  const nextSkills = mergeUniqueStrings(current.skills ?? [], parsed.skills, 80);
  if (JSON.stringify(nextSkills) !== JSON.stringify(current.skills ?? [])) {
    patch.skills = nextSkills;
    touched = true;
  }

  const nextTech = mergeUniqueStrings(current.tech_stack ?? [], parsed.tech_stack, 80);
  if (JSON.stringify(nextTech) !== JSON.stringify(current.tech_stack ?? [])) {
    patch.tech_stack = nextTech;
    touched = true;
  }

  if ((current.niches ?? []).filter(Boolean).length === 0 && parsed.niche_suggestions.length > 0) {
    patch.niches = mergeUniqueStrings([], parsed.niche_suggestions, 40);
    touched = true;
  }

  if (isWeakBio(current.bio) && parsed.summary_suggestion?.trim()) {
    const suggestion = parsed.summary_suggestion.trim().slice(0, 3_500);
    const base = (current.bio ?? "").trim();
    patch.bio = base.length > 0 ? `${base}\n\n${suggestion}` : suggestion;
    touched = true;
  }

  if (isBlank(current.display_name) && parsed.headline_suggestion?.trim()) {
    patch.display_name = parsed.headline_suggestion.trim().slice(0, 120);
    touched = true;
  }

  if (isBlank(current.linkedin_url) && parsed.linkedin_url?.trim()) {
    patch.linkedin_url = parsed.linkedin_url.trim().slice(0, 2000);
    touched = true;
  }
  if (isBlank(current.github_url) && parsed.github_url?.trim()) {
    patch.github_url = parsed.github_url.trim().slice(0, 2000);
    touched = true;
  }

  const prevLinks = (current.portfolio_links ?? []).map((s) => s.trim()).filter(Boolean);
  const nextLinks = [...prevLinks];
  for (const u of parsed.other_urls) {
    const t = u.trim();
    if (!t) continue;
    if (!nextLinks.some((x) => x.toLowerCase() === t.toLowerCase())) nextLinks.push(t);
  }
  const cappedLinks = nextLinks.slice(0, 20);
  if (JSON.stringify(cappedLinks) !== JSON.stringify(prevLinks)) {
    patch.portfolio_links = cappedLinks;
    touched = true;
  }

  if (isBlank(current.experience_level) && parsed.years_experience_hint != null && parsed.years_experience_hint > 0) {
    const y = parsed.years_experience_hint;
    if (y >= 10) patch.experience_level = "lead";
    else if (y >= 6) patch.experience_level = "senior";
    else if (y >= 2) patch.experience_level = "mid";
    else patch.experience_level = "junior";
    touched = true;
  }

  return touched ? patch : null;
}
