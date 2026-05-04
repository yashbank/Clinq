import type { IntegrationProviderId } from "@/types/integrations";

import type { IntegrationProviderAdapter } from "@/lib/integrations/provider";
import { createContraProvider } from "@/lib/integrations/providers/contra";
import { createFiverrProvider } from "@/lib/integrations/providers/fiverr";
import { createFreelancerProvider } from "@/lib/integrations/providers/freelancer";
import { createUpworkProvider } from "@/lib/integrations/providers/upwork";

export function getIntegrationProviderAdapter(id: IntegrationProviderId): IntegrationProviderAdapter {
  switch (id) {
    case "upwork":
      return createUpworkProvider();
    case "freelancer":
      return createFreelancerProvider();
    case "fiverr":
      return createFiverrProvider();
    case "contra":
      return createContraProvider();
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
