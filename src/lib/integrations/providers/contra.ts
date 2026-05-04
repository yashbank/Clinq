import type { IntegrationProviderAdapter } from "@/lib/integrations/provider";
import type { IngestionPlan } from "@/lib/integrations/types";

export function createContraProvider(): IntegrationProviderAdapter {
  return {
    id: "contra",
    capabilities: {
      oauth: false,
      ingestionPlanned: true,
      supportsProfileMetadataImport: false,
    },
    describe() {
      return "Contra adapter (skeleton): public profile metadata hooks only when API access exists.";
    },
    buildIngestionPlan(): IngestionPlan {
      return {
        provider: "contra",
        steps: [
          { id: "oauth_connect", description: "Connect Contra account when OAuth is available.", runnable: false },
          { id: "sync_profile", description: "Import public profile fields allowed by Contra.", runnable: false },
        ],
        notes: ["Prefer official partner APIs; never scrape authenticated pages."],
      };
    },
  };
}
