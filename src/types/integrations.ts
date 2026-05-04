export type IntegrationProviderId = "freelancer" | "upwork" | "fiverr" | "contra";

export type IntegrationStatus = "disconnected" | "connected";

export type IntegrationAccountRow = {
  id: string;
  user_id: string;
  provider: IntegrationProviderId;
  status: IntegrationStatus;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
