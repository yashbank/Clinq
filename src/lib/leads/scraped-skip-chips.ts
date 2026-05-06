/**
 * Compact labels for scraped skip_reason / relevance UI (deterministic, no AI).
 */
export function skipReasonChips(skipReason: string | null | undefined, max = 3): string[] {
  const raw = (skipReason ?? "").trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  if (lower.startsWith("dismissed")) return ["Dismissed"];
  if (lower.includes("promoted to leads") || lower.includes("manually promoted")) return ["Promoted"];

  const parts = raw
    .split(/[·•|;/]+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chips: string[] = [];
  for (const p of parts) {
    const t = p.length > 36 ? `${p.slice(0, 34)}…` : p;
    if (t.length < 3) continue;
    chips.push(t);
    if (chips.length >= max) break;
  }
  if (chips.length) return chips;
  return [raw.length > 40 ? `${raw.slice(0, 38)}…` : raw];
}
