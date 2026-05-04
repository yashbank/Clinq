const STOP = new Set([
  "and",
  "the",
  "with",
  "for",
  "using",
  "via",
  "etc",
  "years",
  "year",
  "experience",
  "team",
  "work",
]);

export function normalizeSkillTokens(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const t = r.trim().replace(/\s+/g, " ");
    if (t.length < 2 || t.length > 48) continue;
    const key = t.toLowerCase();
    if (STOP.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 60) break;
  }
  return out;
}
