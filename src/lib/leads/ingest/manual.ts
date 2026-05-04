import type { CreateLeadInput } from "@/actions/leads";
import { normalizeManualLeadInput } from "@/lib/leads/normalize";
import type { LeadIngestResult } from "@/lib/leads/ingest/types";
import type { LeadSource } from "@/lib/leads/platforms";

export function ingestManualLead(form: Record<string, unknown>): LeadIngestResult {
  const client_name = String(form.client_name ?? "").trim();
  if (!client_name) {
    return { ok: false, error: "Client name is required" };
  }
  const budgetRaw = form.budget;
  const budget =
    budgetRaw === "" || budgetRaw === undefined || budgetRaw === null
      ? undefined
      : Number(budgetRaw);
  if (budget !== undefined && (Number.isNaN(budget) || budget < 0)) {
    return { ok: false, error: "Invalid budget" };
  }

  const input: CreateLeadInput = normalizeManualLeadInput({
    client_name,
    project_title: String(form.project_title ?? "").trim() || undefined,
    project_url: String(form.project_url ?? "").trim() || undefined,
    platform: String(form.platform ?? "").trim() || undefined,
    project_description: String(form.project_description ?? "").trim() || undefined,
    budget,
    email: String(form.email ?? "").trim() || undefined,
    phone: String(form.phone ?? "").trim() || undefined,
    company: String(form.company ?? "").trim() || undefined,
    repeat_hire: form.repeat_hire === true || form.repeat_hire === "on",
    competition_level: form.competition_level ? Number(form.competition_level) : undefined,
    project_quality: form.project_quality ? Number(form.project_quality) : undefined,
    client_history: String(form.client_history ?? "").trim() || undefined,
    proposal_match_notes: String(form.proposal_match_notes ?? "").trim() || undefined,
    source: (form.source as LeadSource) || undefined,
  });

  return { ok: true, input };
}
