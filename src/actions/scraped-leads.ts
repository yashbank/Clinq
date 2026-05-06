"use server";

import { revalidatePath } from "next/cache";

import { normalizeScrapedPayload } from "@/lib/leads/normalize-scraped-payload";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    .select("id, raw_data, source")
    .eq("id", scrapedId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: error?.message ?? "Row not found" };
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
      skip_reason: "Manually promoted to Leads",
      relevance_score: 100,
    })
    .eq("id", scrapedId)
    .eq("user_id", user.id);

  for (const p of ["/leads", "/pipeline", "/dashboard", "/integrations", "/integrations/scraped", "/analytics"]) {
    revalidatePath(p);
  }

  return { ok: true };
}
