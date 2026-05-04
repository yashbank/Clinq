import type { CreateLeadInput } from "@/lib/leads/create-lead-input";

/** Future: Upwork / LinkedIn webhooks return RawLeadPayload → normalize → CreateLeadInput */
export type RawLeadPayload = Record<string, unknown>;

export type LeadIngestResult =
  | { ok: true; input: CreateLeadInput }
  | { ok: false; error: string };
