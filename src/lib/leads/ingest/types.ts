import type { CreateLeadInput } from "@/actions/leads";

/** Future: Upwork / LinkedIn webhooks return RawLeadPayload → normalize → CreateLeadInput */
export type RawLeadPayload = Record<string, unknown>;

export type LeadIngestResult =
  | { ok: true; input: CreateLeadInput }
  | { ok: false; error: string };
