/** Shared domain types (leads, pipeline stages, proposals) — extend as backend lands. */

export type PipelineStage =
  | "saved"
  | "applied"
  | "replied"
  | "interview"
  | "active"
  | "completed"
  | "repeat_client"
  | "lost";
