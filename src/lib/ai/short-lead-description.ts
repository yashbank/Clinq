/**
 * Extractive 1–2 line summary from a full brief (no LLM — deterministic, idempotent).
 * Used as initial `short_description` until a higher-quality model path is wired.
 */
export function generateShortLeadDescription(full: string): string {
  const raw = full.replace(/\s+/g, " ").trim();
  if (!raw) return "";

  const maxLen = 220;
  const sentenceEnd = /[.!?]\s/;
  let out = "";
  let start = 0;
  for (let i = 0; i < 2 && start < raw.length; i++) {
    const slice = raw.slice(start);
    const m = slice.match(sentenceEnd);
    const end = m && m.index != null ? start + m.index + 1 : Math.min(raw.length, start + maxLen);
    const part = raw.slice(start, end).trim();
    if (part) out = out ? `${out} ${part}` : part;
    start = end + (m ? 1 : 0);
    if (!m) break;
  }

  if (!out) {
    out = raw.slice(0, maxLen).trim();
    const lastSpace = out.lastIndexOf(" ");
    if (lastSpace > 80) out = out.slice(0, lastSpace);
  }
  return out.length > maxLen ? `${out.slice(0, maxLen - 1).trim()}…` : out;
}
