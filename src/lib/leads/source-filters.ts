import type { LeadRow } from "@/types/database";

export type LeadSourceFilter = "all" | "imported" | "manual" | "freelancer";

function metaRecord(row: LeadRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

/** True when lead was created via an import pipeline (dedupe key present). */
export function isImportedLeadRow(row: LeadRow): boolean {
  const m = metaRecord(row);
  return typeof m.import_external_id === "string" && m.import_external_id.length > 0;
}

export function isFreelancerLeadRow(row: LeadRow): boolean {
  const m = metaRecord(row);
  const src = typeof m.source === "string" ? m.source.toLowerCase() : "";
  if (src === "freelancer") return true;
  const plat = (row.platform ?? "").toLowerCase();
  return plat.includes("freelancer");
}

/** Curated import from Freelancer (OAuth scrape pipeline), not manual entry. */
export function isFreelancerImportedLeadRow(row: LeadRow): boolean {
  if (!isImportedLeadRow(row)) return false;
  const m = metaRecord(row);
  const ext = typeof m.import_external_id === "string" ? m.import_external_id.toLowerCase() : "";
  if (ext.startsWith("freelancer:")) return true;
  return isFreelancerLeadRow(row);
}

export function getLeadImportedAtIso(row: LeadRow): string | null {
  const m = metaRecord(row);
  const imp = m.import;
  if (imp && typeof imp === "object" && !Array.isArray(imp)) {
    const at = (imp as Record<string, unknown>).imported_at;
    if (typeof at === "string" && at.trim()) return at.trim();
  }
  return null;
}

export function leadMatchesSourceFilter(row: LeadRow, filter: LeadSourceFilter): boolean {
  if (filter === "all") return true;
  const imported = isImportedLeadRow(row);
  if (filter === "imported") return imported;
  if (filter === "manual") return !imported;
  if (filter === "freelancer") return isFreelancerLeadRow(row);
  return true;
}

export function countLeadsBySourceFilter(rows: LeadRow[]): Record<LeadSourceFilter, number> {
  const out: Record<LeadSourceFilter, number> = { all: rows.length, imported: 0, manual: 0, freelancer: 0 };
  for (const r of rows) {
    if (isImportedLeadRow(r)) out.imported += 1;
    else out.manual += 1;
    if (isFreelancerLeadRow(r)) out.freelancer += 1;
  }
  return out;
}
