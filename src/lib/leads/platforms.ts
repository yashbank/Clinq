/** Canonical lead sources — extend with API handlers per channel. */
export const LEAD_SOURCES = ["manual", "freelancer", "upwork", "linkedin", "fiverr", "other"] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export function isLeadSource(s: string): s is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(s);
}

export function normalizePlatformLabel(raw: string | null | undefined): LeadSource {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return "manual";
  if (t.includes("upwork")) return "upwork";
  if (t.includes("linkedin")) return "linkedin";
  if (t.includes("fiverr")) return "fiverr";
  if (t.includes("freelancer")) return "freelancer";
  return "other";
}
