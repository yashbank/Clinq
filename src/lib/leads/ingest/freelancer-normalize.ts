import type { CreateLeadInput } from "@/lib/leads/create-lead-input";

type UnknownRecord = Record<string, unknown>;

function asRecord(v: unknown): UnknownRecord | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as UnknownRecord) : null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function str(v: unknown, max = 20_000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

/** Strip common HTML wrappers from API descriptions (best-effort, not a full sanitizer). */
function stripHtmlLoose(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function briefQualityFromLength(description: string | null | undefined): number {
  const len = (description ?? "").trim().length;
  if (len > 400) return 5;
  if (len > 200) return 4;
  if (len > 80) return 3;
  if (len > 30) return 2;
  return 1;
}

export type NormalizedFreelancerLead = {
  input: CreateLeadInput;
  metadataExtra: Record<string, unknown>;
};

/**
 * Maps a Freelancer `projects` API object into Clinq lead input + import metadata.
 * Defensive: unknown shapes from the wire must not throw.
 */
export function normalizeFreelancerProject(project: unknown, importedAtIso: string): NormalizedFreelancerLead | null {
  const p = asRecord(project);
  if (!p) return null;

  const id = num(p.id) ?? num(p.project_id);
  if (id === null || id <= 0) return null;

  const title = str(p.title, 500) ?? `Project #${id}`;
  const preview = str(p.preview_description, 8000);
  const full = str(p.description, 8000);
  const descriptionRaw = full ?? preview ?? "";
  const description = descriptionRaw.includes("<") ? stripHtmlLoose(descriptionRaw) : descriptionRaw;
  const seoUrl = str(p.seo_url, 400);
  const projectUrl = seoUrl ? `https://www.freelancer.com/projects/${seoUrl}` : `https://www.freelancer.com/projects/${id}`;

  const budgetObj = asRecord(p.budget);
  const currencyObj = asRecord(p.currency);
  const currencyCode = currencyObj ? str(currencyObj.code, 8)?.toUpperCase() ?? null : null;

  const budgetMin = budgetObj ? num(budgetObj.minimum) : null;
  const budgetMax = budgetObj ? num(budgetObj.maximum) : null;

  let budget: number | null = null;
  if (budgetMin !== null && budgetMax !== null) {
    budget = Math.round(((budgetMin + budgetMax) / 2) * 100) / 100;
  } else if (budgetMin !== null) {
    budget = budgetMin;
  } else if (budgetMax !== null) {
    budget = budgetMax;
  }

  const projectTypeRaw = str(p.type, 32)?.toLowerCase() ?? "";
  const budgetType: "fixed" | "hourly" | "unknown" =
    projectTypeRaw.includes("hourly") ? "hourly" : projectTypeRaw.includes("fixed") ? "fixed" : "unknown";

  const ownerId = num(p.owner_id) ?? num(p.ownerId);
  const clientName =
    ownerId !== null ? `Freelancer client (owner ${ownerId})` : `Freelancer client · project ${id}`;

  const jobsRaw = p.jobs;
  const tags: string[] = [];
  if (Array.isArray(jobsRaw)) {
    for (const j of jobsRaw) {
      const jr = asRecord(j);
      const name = jr ? str(jr.name, 120) : null;
      if (name) tags.push(name);
    }
  }

  const bidStats = asRecord(p.bid_stats);
  const bidCount = bidStats ? num(bidStats.bid_count) ?? num(bidStats.count) : null;
  const competition = bidCount !== null ? Math.min(5, Math.max(1, Math.round(bidCount / 3) + 1)) : 3;

  const projectQuality = briefQualityFromLength(description);

  const currencyId = budgetObj ? num(budgetObj.currency_id) : null;
  const projectType = str(p.type, 32);
  const submitdate = str(p.submitdate, 64);

  const rawSnapshot: UnknownRecord = {
    id,
    title,
    type: projectType,
    submitdate,
    currency_id: currencyId,
    currency_code: currencyCode,
    budget_min: budgetMin,
    budget_max: budgetMax,
    budget_type: budgetType,
    owner_id: ownerId,
    bid_count: bidCount,
    seo_url: seoUrl,
    description_preview: description.slice(0, 400) || null,
  };

  const clientSignals: UnknownRecord = {};
  if (ownerId !== null) clientSignals.owner_id = ownerId;
  const lang = str(p.language, 16);
  if (lang) clientSignals.language = lang;

  const proposalNotes = tags.length ? `Listed skills: ${tags.slice(0, 12).join(", ")}` : undefined;

  const importExternalId = `freelancer:${id}`;

  const input: CreateLeadInput = {
    client_name: clientName,
    project_title: title,
    project_url: projectUrl,
    source: "freelancer",
    platform: "Freelancer",
    project_description: description || preview || `Imported Freelancer project ${id}.`,
    budget: budget ?? undefined,
    repeat_hire: false,
    competition_level: competition,
    project_quality: projectQuality,
    client_history: bidCount !== null ? `Open bids (signal): ~${bidCount}` : undefined,
    proposal_match_notes: proposalNotes,
  };

  const metadataExtra: Record<string, unknown> = {
    import_external_id: importExternalId,
    import: {
      provider: "freelancer",
      external_id: String(id),
      imported_at: importedAtIso,
      url: projectUrl,
      tags,
      client_signals: clientSignals,
      raw_snapshot: rawSnapshot,
      budget_min: budgetMin,
      budget_max: budgetMax,
      currency_code: currencyCode,
      budget_type: budgetType,
    },
  };

  return { input, metadataExtra };
}

export function collectImportExternalIds(normalized: NormalizedFreelancerLead[]): string[] {
  const ids: string[] = [];
  for (const n of normalized) {
    const ext = n.metadataExtra.import_external_id;
    if (typeof ext === "string") ids.push(ext);
  }
  return ids;
}
