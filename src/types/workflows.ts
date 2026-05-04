export type WorkflowTypeId = "follow_up_reminder" | "proposal_reminder" | "lead_priority";

export type WorkflowConfig =
  | { days_after: number; note?: string }
  | { days_after: number }
  | { min_score: number };

export type AutomationWorkflowRow = {
  id: string;
  user_id: string;
  name: string;
  workflow_type: WorkflowTypeId;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
