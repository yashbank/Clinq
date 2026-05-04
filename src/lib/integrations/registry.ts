import type { IntegrationProviderId } from "@/types/integrations";

export type IntegrationDefinition = {
  id: IntegrationProviderId;
  label: string;
  description: string;
  /** Future: OAuth slug, scraper module id, etc. */
  moduleKey: string;
  /** Single-letter mark (brand-neutral). */
  initial: string;
};

export const INTEGRATION_PROVIDERS: IntegrationDefinition[] = [
  {
    id: "freelancer",
    label: "Freelancer",
    description: "Prepare account linking for imports and bid context. No scraping until the module ships.",
    moduleKey: "freelancer.v1",
    initial: "F",
  },
  {
    id: "upwork",
    label: "Upwork",
    description: "Reserve connection for structured job ingestion and reply sync.",
    moduleKey: "upwork.v1",
    initial: "U",
  },
  {
    id: "fiverr",
    label: "Fiverr",
    description: "Reserve connection for Fiverr workspace alignment.",
    moduleKey: "fiverr.v1",
    initial: "Fi",
  },
  {
    id: "contra",
    label: "Contra",
    description: "Reserve connection for Contra profile-backed matching.",
    moduleKey: "contra.v1",
    initial: "C",
  },
];
