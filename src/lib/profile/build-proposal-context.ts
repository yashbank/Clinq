import type { FreelancerProfileFields } from "@/types/profile";

const MAX_RESUME_SNIPPET = 6_000;

/**
 * Compact, factual block for the proposal model — no scraping, user-supplied only.
 */
export function buildFreelancerProfileContext(p: FreelancerProfileFields | null): string {
  if (!p) return "";

  const lines: string[] = [];
  if (p.display_name?.trim()) lines.push(`Name / display: ${p.display_name.trim()}`);
  if (p.experience_level?.trim()) lines.push(`Experience level (self-reported): ${p.experience_level.trim()}`);
  if (p.niches?.length) lines.push(`Focus niches: ${p.niches.slice(0, 12).join(", ")}`);
  if (p.skills?.length) lines.push(`Skills: ${p.skills.slice(0, 25).join(", ")}`);
  if (p.tech_stack?.length) lines.push(`Tech stack: ${p.tech_stack.slice(0, 25).join(", ")}`);
  if (p.portfolio_links?.length) {
    lines.push(`Portfolio / work links: ${p.portfolio_links.filter(Boolean).slice(0, 8).join(" · ")}`);
  }
  if (p.linkedin_url?.trim()) lines.push(`LinkedIn: ${p.linkedin_url.trim()}`);
  if (p.github_url?.trim()) lines.push(`GitHub: ${p.github_url.trim()}`);
  if (p.resume_text?.trim()) {
    const snippet = p.resume_text.trim().slice(0, MAX_RESUME_SNIPPET);
    lines.push(`Resume / CV excerpt:\n${snippet}${p.resume_text.length > MAX_RESUME_SNIPPET ? "\n…(truncated for token budget)" : ""}`);
  }

  if (lines.length === 0) return "";

  return [
    "--- Freelancer profile (user-provided facts only; do not invent employers or metrics beyond this) ---",
    ...lines,
    "--- End profile ---",
  ].join("\n");
}
