import "server-only";

import {
  canonicalLeadProjectTitle,
  canonicalLeadSummaryLine,
  canonicalPlatformBadge,
} from "@/lib/leads/canonical-lead-display";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import type { LeadRow } from "@/types/database";

function metaRecord(row: LeadRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

/**
 * RFP seed for Proposal Studio — canonical lead fields only (no raw import payloads).
 */
export function canonicalProposalRfpSeedFromLead(
  row: LeadRow,
  preferredCurrency: string,
  usdToForeignRates: Record<string, number> | null,
): string {
  const meta = metaRecord(row);
  const title = canonicalLeadProjectTitle(row);
  const summary = canonicalLeadSummaryLine(row);
  const platform = canonicalPlatformBadge(row);
  const url = typeof meta.project_url === "string" ? meta.project_url.trim() : "";
  const { label: budgetLine, show: showBudget } = computeLeadBudgetUiLine(row, preferredCurrency, usdToForeignRates);

  const parts = [
    title ? `Title: ${title}` : "",
    `Platform: ${platform}`,
    showBudget && budgetLine ? `Budget (display): ${budgetLine}` : "",
    summary ? `Summary:\n${summary}` : "",
    url ? `Source link: ${url}` : "",
  ].filter(Boolean);

  return parts.join("\n\n");
}

/**
 * Short lines appended in the proposal API when `leadId` is present — still canonical only.
 */
export function canonicalProposalLeadLinesForApi(
  row: LeadRow,
  budgetLine: string | null,
  showBudget: boolean,
): string[] {
  const meta = metaRecord(row);
  const title = canonicalLeadProjectTitle(row);
  const summary = canonicalLeadSummaryLine(row);
  const platform = canonicalPlatformBadge(row);
  const url = typeof meta.project_url === "string" ? meta.project_url.trim() : "";
  const strat = typeof meta.proposal_strategy_hint === "string" ? meta.proposal_strategy_hint.trim() : "";
  const portfolio = typeof meta.portfolio_angle_suggestion === "string" ? meta.portfolio_angle_suggestion.trim() : "";
  const riskBits: string[] = [];
  if (typeof meta.scam_risk_label === "string") {
    if (typeof meta.scam_risk_score === "number") {
      riskBits.push(`Scam risk: ${meta.scam_risk_label} (${meta.scam_risk_score}/100)`);
    } else {
      riskBits.push(`Scam risk: ${meta.scam_risk_label}`);
    }
  }
  if (typeof meta.seriousness_score === "number") {
    riskBits.push(`Seriousness: ${meta.seriousness_score}/100`);
  }
  const scam = riskBits.length ? `${riskBits.join(". ")}.` : "";

  return [
    `Project title: ${title}`,
    `Platform: ${platform}`,
    showBudget && budgetLine ? `Budget (display): ${budgetLine}` : null,
    scam || null,
    strat ? `Strategy hint: ${strat}` : null,
    portfolio ? `Portfolio angle: ${portfolio}` : null,
    row.client_history ? `Stakeholder / history notes: ${row.client_history}` : null,
    row.proposal_match_notes ? `Your match notes: ${row.proposal_match_notes}` : null,
    summary ? `Summary:\n${summary}` : null,
    url ? `Source link: ${url}` : null,
  ].filter((x): x is string => Boolean(x && x.trim()));
}
