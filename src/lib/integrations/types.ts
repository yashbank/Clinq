import type { IntegrationProviderId } from "@/types/integrations";

export type IntegrationSyncStatus = "idle" | "queued" | "running" | "succeeded" | "failed";

export type IntegrationSyncJobType = "full_sync" | "profile" | "jobs_delta" | "leads_delta" | "lead_import";

export type IntegrationSyncJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

/** What the adapter can do today (honest flags — no fake OAuth). */
export type IntegrationCapabilities = {
  oauth: boolean;
  /** When true, a future worker can pull jobs/leads via official APIs. */
  ingestionPlanned: boolean;
  /** Safe metadata import only (no headless login). */
  supportsProfileMetadataImport: boolean;
};

/** Non-secret credential envelope until a vault + OAuth exist. */
export type IntegrationCredentialsV1 = {
  version: 1;
  /** e.g. "none" | "vault_ref" when wired */
  storage: "none";
  externalAccountId?: string | null;
  /** Never put refresh_token / access_token here. */
};

export type IntegrationImportStats = {
  lastJobId?: string | null;
  leadsImported?: number;
  jobsSeen?: number;
  lastError?: string | null;
};

export type IngestionPlanStep = {
  id: string;
  description: string;
  /** When provider ships, worker runs this step. */
  runnable: boolean;
};

export type IngestionPlan = {
  provider: IntegrationProviderId;
  steps: IngestionPlanStep[];
  notes: string[];
};

export type IntegrationSyncJobRow = {
  id: string;
  user_id: string;
  provider: IntegrationProviderId;
  job_type: IntegrationSyncJobType;
  status: IntegrationSyncJobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};
