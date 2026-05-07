"use server";

import { revalidatePath } from "next/cache";

import { clampFreelancerImportLimit, computeFreelancerImportPagePlan } from "@/lib/integrations/source-batch-caps";
import { fetchFreelancerActiveProjects } from "@/lib/integrations/freelancer/api";
import { logFreelancerImport } from "@/lib/logging/app-log";
import { getFreelancerTokensForUser } from "@/lib/integrations/freelancer/token-store";
import { recordLeadImportBatchMetrics } from "@/lib/analytics/record-lead-import-metrics";
import { enqueueIntegrationSyncJob, updateIntegrationAccountSyncFields } from "@/lib/integrations/sync-queue";
import { normalizeFreelancerProject } from "@/lib/leads/ingest/freelancer-normalize";
import { loadScrapedImportExternalIdsForSource } from "@/lib/leads/ingest/scraped-import-dedupe";
import { processScrapedLeads } from "@/lib/leads/process-scraped-leads";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { assessProfileCompleteness, profileCompletenessGateMessage } from "@/lib/profile/profile-completeness";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

export type FreelancerImportPayload = {
  query?: string;
  limit?: number;
};

export type FreelancerImportSuccess = {
  ok: true;
  jobId: string;
  /** Rows returned by Freelancer API for this batch. */
  fetched_count: number;
  /** Rows written to scraped_leads (staging). */
  scraped_staged_count: number;
  /** Rows promoted into leads after relevance gates. */
  promoted_count: number;
  /** Rows skipped by relevance gates (keyword / skill / title). */
  skipped_irrelevant_count: number;
  /** Rows that could not be normalized from payload. */
  skipped_invalid_count: number;
  /** Rows that passed gates but lead insert failed. */
  skipped_persist_failed_count: number;
  duplicate_count: number;
  failed_count: number;
  errors: string[];
  /** Number of Freelancer API pages successfully retrieved for this run. */
  pages_fetched: number;
};

export async function runFreelancerLeadImportAction(
  payload: FreelancerImportPayload,
): Promise<FreelancerImportSuccess | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!hasSupabaseServiceRoleKey()) {
    return { ok: false, error: "Server is missing SUPABASE_SERVICE_ROLE_KEY (required to read OAuth tokens securely)." };
  }

  const tokens = await getFreelancerTokensForUser(user.id);
  if (!tokens?.access_token) {
    return { ok: false, error: "Connect Freelancer first (OAuth or personal access token)." };
  }

  const profFull = await loadFreelancerProfileForAi(supabase, user.id);
  const gate = assessProfileCompleteness(profFull);
  if (!gate.passesCuratedLeadWorkflow) {
    return { ok: false, error: profileCompletenessGateMessage(gate) };
  }

  const limit = clampFreelancerImportLimit(payload.limit);
  const query = (payload.query ?? "").trim();

  logFreelancerImport("job_start", { userId: user.id, limit, query: query || null });

  const syncPatch = await updateIntegrationAccountSyncFields(supabase, {
    userId: user.id,
    provider: "freelancer",
    syncStatus: "queued",
  });
  if (syncPatch.error) {
    return { ok: false, error: syncPatch.error };
  }

  const enq = await enqueueIntegrationSyncJob(supabase, {
    userId: user.id,
    provider: "freelancer",
    jobType: "lead_import",
    payload: { query, limit },
  });
  if ("error" in enq) {
    await updateIntegrationAccountSyncFields(supabase, {
      userId: user.id,
      provider: "freelancer",
      syncStatus: "failed",
      importStatsPatch: { lastError: enq.error },
    });
    return { ok: false, error: enq.error };
  }

  const jobId = enq.jobId;
  const now = new Date().toISOString();
  await supabase
    .from("integration_sync_jobs")
    .update({ status: "running", started_at: now })
    .eq("id", jobId)
    .eq("user_id", user.id);

  const pagePlan = computeFreelancerImportPagePlan(limit);
  const aggregated: unknown[] = [];
  let pagesFetched = 0;
  let lastApiError: string | null = null;
  for (const { offset, pageSize } of pagePlan) {
    const api = await fetchFreelancerActiveProjects({
      accessToken: tokens.access_token,
      query: query || undefined,
      limit: pageSize,
      offset,
    });
    if (!api.ok) {
      lastApiError = api.error;
      break;
    }
    pagesFetched += 1;
    const batch = api.data.projects;
    if (!batch.length) break;
    for (const p of batch) {
      aggregated.push(p);
      if (aggregated.length >= limit) break;
    }
    if (batch.length < pageSize || aggregated.length >= limit) break;
  }

  if (aggregated.length === 0 && lastApiError) {
    const apiError = lastApiError;
    logFreelancerImport(
      "api_fetch_failed",
      { userId: user.id, jobId, error: apiError, query: query || null, pagesFetched },
      "error",
    );
    await supabase
      .from("integration_sync_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: apiError,
        result: { stage: "api_fetch", query: query || null, pages_fetched: pagesFetched },
      })
      .eq("id", jobId)
      .eq("user_id", user.id);
    await updateIntegrationAccountSyncFields(supabase, {
      userId: user.id,
      provider: "freelancer",
      syncStatus: "idle",
      importStatsPatch: { lastError: apiError, lastJobId: jobId },
    });
    await recordLeadImportBatchMetrics(supabase, user.id, {
      provider: "freelancer",
      imported: 0,
      duplicates: 0,
      failed: 0,
      api_error: apiError,
    });
    revalidatePath("/integrations");
    return { ok: false, error: apiError };
  }

  const projectsSlice = aggregated.slice(0, limit);
  const fetched_count = projectsSlice.length;
  const importedAt = new Date().toISOString();

  const normalizedPreview = projectsSlice
    .map((p) => normalizeFreelancerProject(p, importedAt))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const extIds = normalizedPreview
    .map((n) => n.metadataExtra.import_external_id)
    .filter((x): x is string => typeof x === "string" && x.length > 0);

  const existing = new Set<string>();
  const scrapedExisting = await loadScrapedImportExternalIdsForSource(supabase, user.id, "freelancer");
  for (const id of scrapedExisting) existing.add(id);

  if (extIds.length > 0) {
    const { data: existingArr, error: rpcErr } = await supabase.rpc("lead_import_ext_ids_existing", {
      p_ext_ids: extIds,
    });

    if (rpcErr) {
      await supabase
        .from("integration_sync_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: rpcErr.message,
        })
        .eq("id", jobId)
        .eq("user_id", user.id);
      await updateIntegrationAccountSyncFields(supabase, {
        userId: user.id,
        provider: "freelancer",
        syncStatus: "idle",
        importStatsPatch: { lastError: rpcErr.message, lastJobId: jobId },
      });
      revalidatePath("/integrations");
      return { ok: false, error: rpcErr.message };
    }
    if (Array.isArray(existingArr)) {
      for (const x of existingArr as string[]) {
        if (typeof x === "string" && x) existing.add(x);
      }
    }
  }

  let scraped_staged_count = 0;
  let duplicate_count = 0;
  let failed_count = 0;
  const errors: string[] = [];

  const { data: prof } = await supabase.from("profiles").select("tech_stack, niches, skills").eq("id", user.id).maybeSingle();
  const profile = {
    tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
    niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
    skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
  };

  for (const p of projectsSlice) {
    const n = normalizeFreelancerProject(p, importedAt);
    if (!n) {
      failed_count += 1;
      continue;
    }
    const ext = n.metadataExtra.import_external_id;
    if (typeof ext !== "string") {
      failed_count += 1;
      continue;
    }
    if (existing.has(ext)) {
      duplicate_count += 1;
      continue;
    }

    const { error: scrapeErr } = await supabase.from("scraped_leads").insert({
      user_id: user.id,
      source: "freelancer",
      raw_data: {
        import_external_id: ext,
        imported_at: importedAt,
        freelancer_project: p,
      },
      processed: false,
    });
    if (scrapeErr) {
      failed_count += 1;
      errors.push(scrapeErr.message);
      continue;
    }
    scraped_staged_count += 1;
    existing.add(ext);
  }

  const proc = await processScrapedLeads(supabase, user.id, { profile });
  if (proc.errors.length) {
    errors.push(...proc.errors.slice(0, 5));
  }

  const promoted_count = proc.promoted;
  const skipped_irrelevant_count = proc.skipped_irrelevant;
  const skipped_invalid_count = proc.skipped_invalid;
  const skipped_persist_failed_count = proc.skipped_persist_failed;

  logFreelancerImport("import_batch_processed", {
    userId: user.id,
    jobId,
    query: query || null,
    fetched_count,
    pages_fetched: pagesFetched,
    scraped_staged_count,
    promoted_count,
    skipped_irrelevant_count,
    skipped_invalid_count,
    skipped_persist_failed_count,
    duplicate_count,
    failed_count,
    skip_reason_summary: proc.skip_reason_counts,
    scrapeErrors: proc.errors.length,
  });

  await supabase
    .from("integration_sync_jobs")
    .update({
      status: "succeeded",
      completed_at: new Date().toISOString(),
      result: {
        fetched_count,
        scraped_staged_count,
        promoted_count,
        skipped_irrelevant_count,
        skipped_invalid_count,
        skipped_persist_failed_count,
        duplicate_count,
        failed_count,
        imported: promoted_count,
        duplicates: duplicate_count,
        failed: failed_count,
        projectCount: fetched_count,
        pages_fetched: pagesFetched,
        query: query || null,
        skip_reason_counts: proc.skip_reason_counts,
      },
      error: errors.length ? errors.slice(0, 5).join(" | ") : null,
    })
    .eq("id", jobId)
    .eq("user_id", user.id);

  await updateIntegrationAccountSyncFields(supabase, {
    userId: user.id,
    provider: "freelancer",
    syncStatus: "idle",
    lastSyncAt: new Date().toISOString(),
    importStatsPatch: {
      lastJobId: jobId,
      leadsImported: promoted_count,
      jobsSeen: fetched_count,
      lastDuplicates: duplicate_count,
      lastFailed: failed_count,
      lastError: errors.length ? errors[0] : null,
    },
  });

  await recordLeadImportBatchMetrics(supabase, user.id, {
    provider: "freelancer",
    fetched: fetched_count,
    staged: scraped_staged_count,
    imported: promoted_count,
    duplicates: duplicate_count,
    failed: failed_count,
  });

  for (const p of ["/leads", "/pipeline", "/dashboard", "/integrations", "/integrations/scraped"]) {
    revalidatePath(p);
  }

  logFreelancerImport("job_succeeded", {
    userId: user.id,
    jobId,
    fetched_count,
    pages_fetched: pagesFetched,
    promoted_count,
    skipped_irrelevant_count,
    duplicate_count,
    failed_count,
  });

  return {
    ok: true,
    jobId,
    fetched_count,
    scraped_staged_count,
    promoted_count,
    skipped_irrelevant_count,
    skipped_invalid_count,
    skipped_persist_failed_count,
    duplicate_count,
    failed_count,
    errors,
    pages_fetched: pagesFetched,
  };
}

export async function retryFreelancerImportJobAction(
  jobId: string,
): Promise<FreelancerImportSuccess | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: job, error } = await supabase
    .from("integration_sync_jobs")
    .select("id, status, payload, provider, job_type")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !job) {
    return { ok: false, error: error?.message ?? "Job not found" };
  }
  if (job.provider !== "freelancer" || job.job_type !== "lead_import") {
    return { ok: false, error: "Not a Freelancer import job" };
  }
  if (job.status !== "failed") {
    return { ok: false, error: "Only failed imports can be retried" };
  }

  const pl = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload) ? (job.payload as FreelancerImportPayload) : {};
  const res = await runFreelancerLeadImportAction({ query: pl.query, limit: pl.limit });
  if (!res.ok) {
    return { ok: false, error: res.error };
  }
  return res;
}
