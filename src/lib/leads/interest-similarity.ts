import "server-only";

import type { LeadRow } from "@/types/database";

const MIN_TOKEN_LEN = 4;

function metaTitle(row: LeadRow): string {
  const m = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
  return typeof m.project_title === "string" ? m.project_title : "";
}

/** Lowercase alphanumeric tokens for rough similarity. */
export function tokenizeLeadText(row: LeadRow): Set<string> {
  const raw = [row.client_name, row.company ?? "", metaTitle(row), row.project_description ?? "", row.proposal_match_notes ?? ""]
    .join(" ")
    .toLowerCase();
  const tokens = new Set<string>();
  for (const w of raw.split(/[^a-z0-9]+/)) {
    if (w.length >= MIN_TOKEN_LEN) tokens.add(w);
  }
  return tokens;
}

export function tokenOverlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) {
    if (b.has(t)) n += 1;
  }
  return n;
}
