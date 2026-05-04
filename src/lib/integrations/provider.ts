import type { IntegrationProviderId } from "@/types/integrations";

import type { IntegrationCapabilities, IngestionPlan } from "./types";

/**
 * Provider abstraction. Each marketplace module implements this surface.
 * No network I/O is required on the stub — real adapters add OAuth + API clients later.
 */
export interface IntegrationProviderAdapter {
  readonly id: IntegrationProviderId;
  readonly capabilities: IntegrationCapabilities;
  /** Human-readable module description for logs / admin. */
  describe(): string;
  /** Declarative ingestion pipeline (orchestrator persists jobs against this plan). */
  buildIngestionPlan(): IngestionPlan;
}
