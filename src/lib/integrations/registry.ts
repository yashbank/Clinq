import type { IntegrationProviderId } from "@/types/integrations";

export type IntegrationDefinition = {
  id: IntegrationProviderId;
  label: string;
  description: string;
  /** Stable module key for logs and future workers. */
  moduleKey: string;
  /** Single-letter mark (brand-neutral). */
  initial: string;
};

export const INTEGRATION_PROVIDERS: IntegrationDefinition[] = [
  {
    id: "freelancer",
    label: "Freelancer",
    description: "OAuth2 + official REST API: import active project listings into Clinq with dedupe and scoring.",
    moduleKey: "freelancer.v1",
    initial: "F",
  },
  {
    id: "upwork",
    label: "Upwork",
    description: "Reserved integration slot. Official APIs only—no scraping in Clinq.",
    moduleKey: "upwork.v1",
    initial: "U",
  },
  {
    id: "fiverr",
    label: "Fiverr",
    description: "Reserved integration slot for seller workspace alignment.",
    moduleKey: "fiverr.v1",
    initial: "Fi",
  },
  {
    id: "contra",
    label: "Contra",
    description: "Reserved integration slot for Contra-backed matching.",
    moduleKey: "contra.v1",
    initial: "C",
  },
];
