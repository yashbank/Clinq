import { generateShortLeadDescription } from "@/lib/ai/short-lead-description";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import type { LeadRow } from "@/types/database";

function metaRecord(row: LeadRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

/** Prefer stored project title; avoid generic Freelancer client placeholder as the headline. */
export function leadKanbanTitle(row: LeadRow): string {
  const meta = metaRecord(row);
  const projectTitle = typeof meta.project_title === "string" ? meta.project_title.trim() : "";
  if (projectTitle.length > 0) return projectTitle;
  const client = row.client_name.trim();
  if (/^freelancer client\b/i.test(client)) {
    const firstLine = (row.project_description ?? "").split(/\n/)[0]?.trim() ?? "";
    if (firstLine.length > 3) return firstLine.slice(0, 140);
  }
  return client.length > 0 ? client : "Untitled project";
}

export function leadKanbanSummary(row: LeadRow): string {
  const fromDb = typeof row.short_description === "string" ? row.short_description.trim() : "";
  if (fromDb.length > 0) return fromDb.slice(0, 220);
  const desc = generateShortLeadDescription(row.project_description ?? "");
  if (desc.length > 0) return desc;
  return generateShortLeadDescription(leadKanbanTitle(row));
}

export function leadKanbanBudgetLine(
  row: LeadRow,
  currency?: { preferredCurrency: string; usdToForeignRates: Record<string, number> | null },
): {
  label: string;
  show: boolean;
  kind: "fixed" | "hourly" | "unknown";
} {
  return computeLeadBudgetUiLine(row, currency?.preferredCurrency ?? null, currency?.usdToForeignRates ?? null);
}
