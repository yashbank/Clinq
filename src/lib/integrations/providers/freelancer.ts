import type { IntegrationProviderAdapter } from "@/lib/integrations/provider";
import type { IngestionPlan } from "@/lib/integrations/types";

export function createFreelancerProvider(): IntegrationProviderAdapter {
  return {
    id: "freelancer",
    capabilities: {
      oauth: false,
      ingestionPlanned: true,
      supportsProfileMetadataImport: false,
    },
    describe() {
      return "Freelancer.com adapter (skeleton): OAuth + REST project endpoints not wired yet.";
    },
    buildIngestionPlan(): IngestionPlan {
      return {
        provider: "freelancer",
        steps: [
          { id: "oauth_connect", description: "OAuth2 authorization for Freelancer API.", runnable: false },
          { id: "sync_projects", description: "Fetch active projects / bids context.", runnable: false },
          { id: "persist_leads", description: "Upsert normalized leads for Clinq scoring.", runnable: false },
        ],
        notes: ["Use documented Freelancer APIs only; no credential stuffing or scraping."],
      };
    },
  };
}
