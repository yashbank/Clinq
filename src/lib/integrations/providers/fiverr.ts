import type { IntegrationProviderAdapter } from "@/lib/integrations/provider";
import type { IngestionPlan } from "@/lib/integrations/types";

export function createFiverrProvider(): IntegrationProviderAdapter {
  return {
    id: "fiverr",
    capabilities: {
      oauth: false,
      ingestionPlanned: true,
      supportsProfileMetadataImport: false,
    },
    describe() {
      return "Fiverr adapter (skeleton): seller APIs / OAuth not wired in this release.";
    },
    buildIngestionPlan(): IngestionPlan {
      return {
        provider: "fiverr",
        steps: [
          { id: "oauth_connect", description: "Connect Fiverr seller account via supported OAuth flow.", runnable: false },
          { id: "sync_orders", description: "Pull order summaries permitted by API scopes.", runnable: false },
        ],
        notes: ["Fiverr API access is scope-limited; ingestion will only import data the user authorizes."],
      };
    },
  };
}
