import { buildWorkflowSuggestions, type WorkflowIntelligenceInput, type WorkflowSuggestionKind } from "@/lib/automation/workflow-intelligence";

export type DailyActionType = "apply" | "follow_up" | "improve_proposal" | "missed_opportunity" | "scraped_queue";

export type DailyAction = {
  type: DailyActionType;
  priority: number;
  reason: string;
  /** Row headline (project title or proposal title). */
  headline: string;
  /** Primary CTA target. */
  actionHref: string;
  leadId?: string;
  proposalId?: string;
  /** Stable id for dismiss persistence (`kind:key`). */
  suggestionId: string;
  suggestionKind: WorkflowSuggestionKind;
};

function mapKindToDailyType(kind: WorkflowSuggestionKind): DailyActionType {
  if (kind === "tighten_proposal") return "improve_proposal";
  if (kind === "thread_follow_up" || kind === "proposal_thread_reminder") return "follow_up";
  if (kind === "review_skipped_scrapes") return "scraped_queue";
  if (kind === "missed_high_score" || kind === "stale_strong_saved") return "missed_opportunity";
  return "apply";
}

/**
 * Top daily queue items derived from deterministic workflow intelligence (real data only).
 */
export function buildDailyActions(args: WorkflowIntelligenceInput): DailyAction[] {
  const suggestions = buildWorkflowSuggestions(args);
  return suggestions.slice(0, 6).map((s) => ({
    type: mapKindToDailyType(s.kind),
    priority: s.priority,
    reason: s.why,
    headline: s.title,
    actionHref: s.href,
    leadId: s.leadId,
    proposalId: s.proposalId,
    suggestionId: s.id,
    suggestionKind: s.kind,
  }));
}
