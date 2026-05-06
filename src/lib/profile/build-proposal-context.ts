import type { FreelancerProfileFields } from "@/types/profile";

const MAX_RESUME_SNIPPET = 6_000;

/**
 * Compact, factual block for the proposal model — user-supplied + stored intelligence only.
 */
export function buildFreelancerProfileContext(p: FreelancerProfileFields | null): string {
  if (!p) return "";

  const lines: string[] = [];
  if (p.display_name?.trim()) lines.push(`Name / display: ${p.display_name.trim()}`);
  if (p.bio?.trim()) lines.push(`Bio: ${p.bio.trim()}`);
  if (p.website_url?.trim()) lines.push(`Website: ${p.website_url.trim()}`);
  if (p.experience_level?.trim()) lines.push(`Experience level (self-reported): ${p.experience_level.trim()}`);
  if (p.niches?.length) lines.push(`Focus niches: ${p.niches.slice(0, 12).join(", ")}`);
  if (p.skills?.length) lines.push(`Skills: ${p.skills.slice(0, 25).join(", ")}`);
  if (p.tech_stack?.length) lines.push(`Tech stack: ${p.tech_stack.slice(0, 25).join(", ")}`);

  const strengthChips: string[] = [];
  const seen = new Set<string>();
  for (const s of [...(p.skills ?? []), ...(p.tech_stack ?? [])]) {
    const t = String(s).trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    strengthChips.push(t);
    if (strengthChips.length >= 12) break;
  }
  if (strengthChips.length) {
    lines.push(
      `Use 2–3 of these strengths only where they clearly match the RFP (verbatim phrasing, no filler adjectives): ${strengthChips.join(", ")}.`,
    );
  }
  if (p.portfolio_links?.length) {
    lines.push(`Portfolio / work links: ${p.portfolio_links.filter(Boolean).slice(0, 8).join(" · ")}`);
  }
  if (p.linkedin_url?.trim()) lines.push(`LinkedIn: ${p.linkedin_url.trim()}`);
  if (p.github_url?.trim()) lines.push(`GitHub: ${p.github_url.trim()}`);
  if (p.resume_text?.trim()) {
    const snippet = p.resume_text.trim().slice(0, MAX_RESUME_SNIPPET);
    lines.push(`Resume / CV excerpt:\n${snippet}${p.resume_text.length > MAX_RESUME_SNIPPET ? "\n…(truncated for token budget)" : ""}`);
  }

  const intel = p.profile_intelligence;
  if (intel?.version === 1) {
    lines.push(
      `Profile intelligence (machine summary, v${intel.version}): ${intel.positioningLine} — ${intel.idealProjectSummary}`,
    );
    lines.push(`Tone hint: ${intel.proposalToneHint}`);
    if (intel.normalizedSkills.length) {
      lines.push(`Normalized skill surface: ${intel.normalizedSkills.slice(0, 20).join(", ")}`);
    }
    lines.push(`Profile quality score (internal): ${intel.profileQualityScore}/100`);
  }

  if (lines.length === 0) return "";

  return [
    "--- Freelancer profile (user-provided facts + stored intelligence; do not invent employers or metrics beyond this) ---",
    ...lines,
    "--- End profile ---",
  ].join("\n");
}
