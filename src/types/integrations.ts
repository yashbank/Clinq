export type IntegrationProviderId = "freelancer" | "upwork" | "fiverr" | "contra";

export type IntegrationStatus = "disconnected" | "connected";

export type IntegrationSyncStatus = "idle" | "queued" | "running" | "succeeded" | "failed";

export type IntegrationAccountRow = {
  id: string;
  user_id: string;
  provider: IntegrationProviderId;
  status: IntegrationStatus;
  meta: Record<string, unknown>;
  sync_status?: IntegrationSyncStatus;
  last_sync_at?: string | null;
  import_stats?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
