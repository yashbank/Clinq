"use server";

import { revalidatePath } from "next/cache";

import { normalizeScrapedPayload } from "@/lib/leads/normalize-scraped-payload";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVAL_SCRAPED = ["/leads", "/pipeline", "/dashboard", "/integrations", "/integrations/scraped", "/analytics"] as const;

function revalidateScrapedSurface() {
  for (const p of REVAL_SCRAPED) {
    revalidatePath(p);
  }
}

export async function dismissScrapedLeadAction(
  scrapedId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("scraped_leads")
    .update({
      processed: true,
      dismissed_at: now,
      skip_reason: "Dismissed",
    })
    .eq("id", scrapedId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidateScrapedSurface();
  return { ok: true };
}

export async function dismissScrapedLeadsBulkAction(
  scrapedIds: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const ids = [...new Set(scrapedIds)].filter((x) => typeof x === "string" && x.length > 0).slice(0, 50);
  if (!ids.length) {
    return { ok: false, error: "No rows selected" };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("scraped_leads")
    .update({
      processed: true,
      dismissed_at: now,
      skip_reason: "Dismissed",
    })
    .in("id", ids)
    .eq("user_id", user.id)
    .select("id");
  if (error) {
    return { ok: false, error: error.message };
  }
  const count = data?.length ?? 0;
  revalidateScrapedSurface();
  return { ok: true, count };
}

export async function promoteScrapedLeadsBulkAction(
  scrapedIds: string[],
): Promise<{ ok: true; promoted: number; errors: string[] } | { ok: false; error: string }> {
  const ids = [...new Set(scrapedIds)].filter((x) => typeof x === "string" && x.length > 0).slice(0, 25);
  if (!ids.length) {
    return { ok: false, error: "No rows selected" };
  }
  const errors: string[] = [];
  let promoted = 0;
  for (const id of ids) {
    const res = await promoteScrapedLeadManuallyAction(id);
    if (res.ok) promoted += 1;
    else errors.push(res.error);
  }
  return { ok: true, promoted, errors };
}

export async function promoteScrapedLeadManuallyAction(
  scrapedId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: row, error } = await supabase
    .from("scraped_leads")
    .select("id, raw_data, source, dismissed_at")
    .eq("id", scrapedId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: error?.message ?? "Row not found" };
  }
  if (row.dismissed_at) {
    return { ok: false, error: "This row was dismissed." };
  }

  const raw = row.raw_data && typeof row.raw_data === "object" && !Array.isArray(row.raw_data) ? (row.raw_data as Record<string, unknown>) : {};
  const ext = raw.import_external_id;
  if (typeof ext === "string" && ext.length > 0) {
    const { data: dup } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", user.id)
      .eq("metadata->>import_external_id", ext)
      .is("deleted_at", null)
      .is("archived_at", null)
      .maybeSingle();
    if (dup?.id) {
      return { ok: false, error: "A lead with this external id already exists." };
    }
  }

  const importedAt = typeof raw.imported_at === "string" ? raw.imported_at : new Date().toISOString();
  const normalized = normalizeScrapedPayload(row.source, raw, importedAt);
  if (!normalized) {
    return { ok: false, error: "Could not normalize this scraped row." };
  }

  const { data: prof } = await supabase.from("profiles").select("tech_stack, niches, skills").eq("id", user.id).maybeSingle();
  const profile = {
    tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
    niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
    skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
  };

  const ins = await insertLeadWithIntelligence(supabase, user.id, normalized.input, {
    profile,
    metadataExtra: normalized.metadataExtra,
    revalidatePaths: ["/leads", "/pipeline", "/dashboard", "/integrations/scraped", "/analytics"],
  });
  if (!ins.ok) {
    return { ok: false, error: ins.error };
  }

  await supabase
    .from("scraped_leads")
    .update({
      processed: true,
      dismissed_at: null,
      skip_reason: "Manually promoted to Leads",
      relevance_score: 100,
    })
    .eq("id", scrapedId)
    .eq("user_id", user.id);

  revalidateScrapedSurface();

  return { ok: true };
}
