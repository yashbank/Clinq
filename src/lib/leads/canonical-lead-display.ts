import { generateShortLeadDescription } from "@/lib/ai/short-lead-description";
import type { LeadRow } from "@/types/database";

function metaRecord(row: LeadRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

/** Legacy noisy Freelancer placeholder client strings. */
const FREELANCER_CLIENT_PLACEHOLDER = /^freelancer client(\s+·\s+project\s+#?\d+|\s*\(owner\s+\d+\))/i;

/**
 * Primary headline for a lead: project title from metadata, never "Freelancer client · project #…".
 */
export function canonicalLeadProjectTitle(row: LeadRow): string {
  const meta = metaRecord(row);
  const projectTitle = typeof meta.project_title === "string" ? meta.project_title.trim() : "";
  if (projectTitle.length > 0) return projectTitle.slice(0, 200);

  const client = row.client_name.trim();
  if (client.length > 0 && !FREELANCER_CLIENT_PLACEHOLDER.test(client)) {
    return client.slice(0, 200);
  }

  const firstLine = (row.project_description ?? "").split(/\n/)[0]?.trim() ?? "";
  if (firstLine.length > 3) return firstLine.slice(0, 200);

  return "Untitled project";
}

/**
 * One–two line summary for tables and cards.
 */
export function canonicalLeadSummaryLine(row: LeadRow): string {
  const fromDb = typeof row.short_description === "string" ? row.short_description.trim() : "";
  if (fromDb.length > 0) return fromDb.slice(0, 280);
  const title = canonicalLeadProjectTitle(row);
  const fromDesc = generateShortLeadDescription(row.project_description ?? "");
  if (fromDesc.length > 0) return fromDesc.slice(0, 280);
  return generateShortLeadDescription(title).slice(0, 280);
}

export function canonicalPlatformBadge(row: LeadRow): string {
  const p = (row.platform ?? "").trim();
  if (p.length > 0) return p;
  const meta = metaRecord(row);
  const src = typeof meta.source === "string" ? meta.source.trim() : "";
  if (src.length > 0) return src.charAt(0).toUpperCase() + src.slice(1);
  return "—";
}

/** Proposal studio deep link with lead context. */
export function canonicalProposalHref(leadId: string): string {
  return `/proposals?leadId=${encodeURIComponent(leadId)}`;
}

/** External listing URL when present and valid (e.g. Freelancer project link). */
export function canonicalLeadListingUrl(row: LeadRow): string | null {
  const meta = metaRecord(row);
  const raw = typeof meta.project_url === "string" ? meta.project_url.trim() : "";
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}
