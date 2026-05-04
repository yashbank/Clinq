import type { IntegrationProviderAdapter } from "@/lib/integrations/provider";
import type { IngestionPlan } from "@/lib/integrations/types";

export function createUpworkProvider(): IntegrationProviderAdapter {
  return {
    id: "upwork",
    capabilities: {
      oauth: false,
      ingestionPlanned: true,
      supportsProfileMetadataImport: false,
    },
    describe() {
      return "Upwork adapter (skeleton): OAuth and GraphQL job APIs are not wired in this release.";
    },
    buildIngestionPlan(): IngestionPlan {
      return {
        provider: "upwork",
        steps: [
          {
            id: "oauth_connect",
            description: "User completes OAuth consent; store refresh token in vault (not implemented).",
            runnable: false,
          },
          {
            id: "fetch_open_jobs",
            description: "Pull open job postings the user is allowed to access via official API.",
            runnable: false,
          },
          {
            id: "normalize_leads",
            description: "Map API payloads into Clinq lead rows + dedupe keys.",
            runnable: false,
          },
        ],
        notes: [
          "Do not scrape Upwork HTML or automate browsers — only official APIs when credentials exist.",
        ],
      };
    },
  };
}
