export type PipelineStage =
  | "saved"
  | "applied"
  | "replied"
  | "interview"
  | "active"
  | "completed";

export type LeadInterestStatus = "interested" | "not_interested";

export type LeadRow = {
  id: string;
  user_id: string;
  client_name: string;
  platform: string | null;
  project_description: string | null;
  /** Extractive or cached 1–2 line summary for list UI. */
  short_description?: string | null;
  budget: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_avg?: number | null;
  currency_original?: string | null;
  budget_usd?: number | null;
  score: number;
  stage: PipelineStage;
  email: string | null;
  phone: string | null;
  company: string | null;
  repeat_hire: boolean;
  competition_level: number;
  project_quality: number;
  client_history: string | null;
  proposal_match_notes: string | null;
  metadata: Record<string, unknown>;
  /** Versioned lead intelligence pipeline output (see `lead-intelligence-pipeline`). */
  intelligence?: Record<string, unknown>;
  interest_status?: LeadInterestStatus | null;
  deleted_at?: string | null;
  archived_at?: string | null;
  similarity_demotion?: number | null;
  /** Generated: score − similarity_demotion (clamped). */
  sort_key?: number | null;
  /** Generated from metadata + platform. */
  is_freelancer_channel?: boolean | null;
  /** Generated: import_external_id present. */
  is_imported_lead?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  user_id: string;
  lead_id: string | null;
  name: string;
  description: string | null;
  status: string;
  earnings: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProposalRow = {
  id: string;
  user_id: string;
  lead_id: string | null;
  title: string | null;
  body: string;
  mode: "short" | "long";
  tone: string;
  model: string;
  evaluation?: Record<string, unknown> | null;
  created_at: string;
};

export type ActivityRow = {
  id: string;
  user_id: string;
  lead_id: string | null;
  type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
