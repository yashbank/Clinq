import type { IntegrationProviderAdapter } from "@/lib/integrations/provider";
import type { IngestionPlan } from "@/lib/integrations/types";

export function createFreelancerProvider(): IntegrationProviderAdapter {
  return {
    id: "freelancer",
    capabilities: {
      oauth: true,
      ingestionPlanned: true,
      supportsProfileMetadataImport: false,
    },
    describe() {
      return "Freelancer.com: OAuth2 + documented REST project search (active listings) → Clinq lead rows.";
    },
    buildIngestionPlan(): IngestionPlan {
      return {
        provider: "freelancer",
        steps: [
          { id: "oauth_connect", description: "OAuth2 authorization for Freelancer API (accounts.freelancer.com).", runnable: true },
          { id: "sync_projects", description: "GET /api/projects/0.1/projects/active/ with user token (rate limits apply).", runnable: true },
          { id: "persist_leads", description: "Normalize, dedupe, insert leads; run Clinq intelligence pipeline.", runnable: true },
        ],
        notes: [
          "Official Freelancer REST API only — header Freelancer-OAuth-V1.",
          "Respect platform rate limits; imports are bounded batches (see UI).",
        ],
      };
    },
  };
}
