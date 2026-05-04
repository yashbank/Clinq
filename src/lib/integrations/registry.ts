import type { IntegrationProviderId } from "@/types/integrations";

export type IntegrationDefinition = {
  id: IntegrationProviderId;
  label: string;
  description: string;
  /** Future: OAuth slug, scraper module id, etc. */
  moduleKey: string;
};

export const INTEGRATION_PROVIDERS: IntegrationDefinition[] = [
  {
    id: "freelancer",
    label: "Freelancer",
    description: "Link your account to prepare imports and bid context (import module coming).",
    moduleKey: "freelancer.v1",
  },
  {
    id: "upwork",
    label: "Upwork",
    description: "Connect for structured job ingestion when the Upwork module ships.",
    moduleKey: "upwork.v1",
  },
  {
    id: "fiverr",
    label: "Fiverr",
    description: "Reserved for Fiverr workspace sync—no automation runs today.",
    moduleKey: "fiverr.v1",
  },
  {
    id: "contra",
    label: "Contra",
    description: "Contra connection placeholder for future profile-backed matching.",
    moduleKey: "contra.v1",
  },
];
