import type { LeadSource } from "@/lib/leads/platforms";

/** Server + ingest pipeline input for creating a scored lead row. */
export type CreateLeadInput = {
  client_name: string;
  project_title?: string;
  project_url?: string;
  source?: LeadSource;
  platform?: string;
  project_description?: string;
  budget?: number;
  email?: string;
  phone?: string;
  company?: string;
  repeat_hire?: boolean;
  competition_level?: number;
  project_quality?: number;
  client_history?: string;
  proposal_match_notes?: string;
};
