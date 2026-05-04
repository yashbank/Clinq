import type { CreateLeadInput } from "@/actions/leads";
import { normalizePlatformLabel, type LeadSource } from "@/lib/leads/platforms";

/** Normalize manual / pasted intake into server action input. */
export function normalizeManualLeadInput(input: {
  client_name: string;
  project_title?: string;
  project_url?: string;
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
  source?: LeadSource;
}): CreateLeadInput {
  const source: LeadSource = input.source ?? normalizePlatformLabel(input.platform);
  return {
    client_name: input.client_name.trim(),
    project_title: input.project_title?.trim() || undefined,
    project_url: input.project_url?.trim() || undefined,
    platform: input.platform?.trim() || undefined,
    project_description: input.project_description?.trim() || undefined,
    budget: input.budget,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    company: input.company?.trim() || undefined,
    repeat_hire: input.repeat_hire,
    competition_level: input.competition_level,
    project_quality: input.project_quality,
    client_history: input.client_history?.trim() || undefined,
    proposal_match_notes: input.proposal_match_notes?.trim() || undefined,
    source,
  };
}
