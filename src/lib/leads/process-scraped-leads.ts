import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import { normalizeFreelancerProject } from "@/lib/leads/ingest/freelancer-normalize";
import { computeLeadFreelancerMatch } from "@/lib/leads/lead-freelancer-match";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";
import type { LeadRow } from "@/types/database";

type ProfileSnap = {
  skills: string[];
  niches: string[];
  tech_stack: string[];
};

function syntheticLeadForMatch(input: CreateLeadInput, metadataExtra: Record<string, unknown>): LeadRow {
  const meta = {
    ...(metadataExtra as Record<string, unknown>),
    project_title: input.project_title ?? null,
    project_url: input.project_url ?? null,
    source: input.source ?? "freelancer",
  };
  return {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000002",
    client_name: input.client_name,
    platform: input.platform ?? null,
    project_description: input.project_description ?? null,
    budget: input.budget ?? null,
    score: 55,
    stage: "saved",
    email: null,
    phone: null,
    company: input.company ?? null,
    repeat_hire: Boolean(input.repeat_hire),
    competition_level: input.competition_level ?? 2,
    project_quality: input.project_quality ?? 3,
    client_history: input.client_history ?? null,
    proposal_match_notes: input.proposal_match_notes ?? null,
    metadata: meta as Record<string, unknown>,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as LeadRow;
}

/** 0–30 higher = healthier budget vs brief (deterministic). */
function budgetSanityPoints(input: CreateLeadInput): number {
  const b = Math.max(0, Number(input.budget) || 0);
  const d = `${input.project_title ?? ""} ${input.project_description ?? ""}`.toLowerCase();
  if (b > 0 && b < 250 && /(full|complete)\s*(app|website|platform|saas)/i.test(d)) return 12;
  if (b > 0 && b < 500 && /(enterprise|multi-tenant|kubernetes)/i.test(d)) return 14;
  if (b === 0 && d.length < 35) return 10;
  if (b > 0 && b < 150 && d.length > 200) return 16;
  return 28;
}

/**
 * 0–100 relevance for promoting a scraped row into `leads` (no LLM).
 */
export function computeScrapedPromotionScore(
  input: CreateLeadInput,
  profile: ProfileSnap,
  metadataExtra: Record<string, unknown>,
): number {
  const synth = syntheticLeadForMatch(input, metadataExtra);
  const { skillMatchPct } = computeLeadFreelancerMatch(synth, {
    skills: profile.skills,
    niches: profile.niches,
    techStack: profile.tech_stack,
  });
  const bSan = budgetSanityPoints(input);
  const bPart = (bSan / 30) * 100;
  return Math.round(Math.min(100, Math.max(0, 0.62 * skillMatchPct + 0.38 * bPart)));
}

type ScrapedRow = {
  id: string;
  raw_data: Record<string, unknown>;
  source: string;
};

export async function processScrapedLeads(
  supabase: SupabaseClient,
  userId: string,
  options?: { profile?: ProfileSnap | null },
): Promise<{ promoted: number; skipped: number; errors: string[] }> {
  let profile = options?.profile;
  if (profile === undefined) {
    const { data: prof } = await supabase.from("profiles").select("tech_stack, niches, skills").eq("id", userId).maybeSingle();
    profile = {
      tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
      niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
      skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
    };
  }
  const profSnap = profile ?? { tech_stack: [], niches: [], skills: [] };

  const { data: rows, error } = await supabase
    .from("scraped_leads")
    .select("id, raw_data, source")
    .eq("user_id", userId)
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return { promoted: 0, skipped: 0, errors: [error.message] };
  }

  let promoted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of (rows ?? []) as ScrapedRow[]) {
    const raw = row.raw_data && typeof row.raw_data === "object" ? row.raw_data : {};
    const importedAt = typeof raw.imported_at === "string" ? raw.imported_at : new Date().toISOString();
    const freelancerProject = raw.freelancer_project;

    const normalized =
      row.source === "freelancer" && freelancerProject != null
        ? normalizeFreelancerProject(freelancerProject, importedAt)
        : null;

    if (!normalized) {
      await supabase.from("scraped_leads").update({ processed: true }).eq("id", row.id).eq("user_id", userId);
      skipped += 1;
      continue;
    }

    const rel = computeScrapedPromotionScore(normalized.input, profSnap, normalized.metadataExtra);

    if (rel >= 60) {
      const ins = await insertLeadWithIntelligence(supabase, userId, normalized.input, {
        profile: profSnap,
        metadataExtra: normalized.metadataExtra,
        revalidatePaths: [],
      });
      if (!ins.ok) {
        errors.push(ins.error);
        await supabase.from("scraped_leads").update({ processed: true }).eq("id", row.id).eq("user_id", userId);
        skipped += 1;
        continue;
      }
      promoted += 1;
    } else {
      skipped += 1;
    }

    await supabase.from("scraped_leads").update({ processed: true }).eq("id", row.id).eq("user_id", userId);
  }

  return { promoted, skipped, errors };
}
