"use server";

import { revalidatePath } from "next/cache";

import { fetchFreelancerActiveProjects } from "@/lib/integrations/freelancer/api";
import { getFreelancerTokensForUser } from "@/lib/integrations/freelancer/token-store";
import { recordLeadImportBatchMetrics } from "@/lib/analytics/record-lead-import-metrics";
import { enqueueIntegrationSyncJob } from "@/lib/integrations/sync-queue";
import { updateIntegrationAccountSyncFields } from "@/lib/integrations/sync-queue";
import {
  collectImportExternalIds,
  normalizeFreelancerProject,
} from "@/lib/leads/ingest/freelancer-normalize";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

export type FreelancerImportPayload = {
  query?: string;
  limit?: number;
};

export async function runFreelancerLeadImportAction(
  payload: FreelancerImportPayload,
): Promise<
  | {
      ok: true;
      jobId: string;
      imported: number;
      duplicates: number;
      failed: number;
      errors: string[];
    }
  | { ok: false; error: string }
> {
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

  const limit = Math.min(30, Math.max(1, payload.limit ?? 15));
  const query = (payload.query ?? "").trim();

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

  const api = await fetchFreelancerActiveProjects({
    accessToken: tokens.access_token,
    query: query || undefined,
    limit,
    offset: 0,
  });

  if (!api.ok) {
    await supabase
      .from("integration_sync_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: api.error,
        result: { stage: "api_fetch", status: api.status ?? null },
      })
      .eq("id", jobId)
      .eq("user_id", user.id);
    await updateIntegrationAccountSyncFields(supabase, {
      userId: user.id,
      provider: "freelancer",
      syncStatus: "idle",
      importStatsPatch: { lastError: api.error, lastJobId: jobId },
    });
    await recordLeadImportBatchMetrics(supabase, user.id, {
      provider: "freelancer",
      imported: 0,
      duplicates: 0,
      failed: 0,
      api_error: api.error,
    });
    revalidatePath("/integrations");
    return { ok: false, error: api.error };
  }

  const importedAt = new Date().toISOString();
  const normalized = api.data.projects
    .map((p) => normalizeFreelancerProject(p, importedAt))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const extIds = collectImportExternalIds(normalized);
  const existing = new Set<string>();
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
  let imported = 0;
  let duplicates = 0;
  let failed = 0;
  const errors: string[] = [];

  const { data: prof } = await supabase.from("profiles").select("tech_stack, niches, skills").eq("id", user.id).maybeSingle();
  const profile = {
    tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
    niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
    skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
  };

  for (const n of normalized) {
    const ext = n.metadataExtra.import_external_id;
    if (typeof ext !== "string") {
      failed += 1;
      continue;
    }
    if (existing.has(ext)) {
      duplicates += 1;
      continue;
    }

    const ins = await insertLeadWithIntelligence(supabase, user.id, n.input, {
      profile,
      metadataExtra: n.metadataExtra,
      revalidatePaths: [],
    });
    if (!ins.ok) {
      failed += 1;
      errors.push(ins.error);
      continue;
    }
    imported += 1;
    existing.add(ext);
  }

  await supabase
    .from("integration_sync_jobs")
    .update({
      status: "succeeded",
      completed_at: new Date().toISOString(),
      result: {
        imported,
        duplicates,
        failed,
        projectCount: api.data.projects.length,
        query: query || null,
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
      leadsImported: imported,
      jobsSeen: api.data.projects.length,
      lastDuplicates: duplicates,
      lastFailed: failed,
      lastError: errors.length ? errors[0] : null,
    },
  });

  await recordLeadImportBatchMetrics(supabase, user.id, {
    provider: "freelancer",
    imported,
    duplicates,
    failed,
  });

  for (const p of ["/leads", "/pipeline", "/dashboard", "/integrations"]) {
    revalidatePath(p);
  }

  return { ok: true, jobId, imported, duplicates, failed, errors };
}

export async function retryFreelancerImportJobAction(jobId: string): Promise<
  | {
      ok: true;
      imported: number;
      duplicates: number;
      failed: number;
      errors: string[];
    }
  | { ok: false; error: string }
> {
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
  return { ok: true, imported: res.imported, duplicates: res.duplicates, failed: res.failed, errors: res.errors };
}
