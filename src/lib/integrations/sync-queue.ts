import type { SupabaseClient } from "@supabase/supabase-js";

import type { IntegrationProviderId } from "@/types/integrations";

import type { IntegrationSyncJobType } from "./types";

export async function enqueueIntegrationSyncJob(
  supabase: SupabaseClient,
  args: {
    userId: string;
    provider: IntegrationProviderId;
    jobType: IntegrationSyncJobType;
    payload?: Record<string, unknown>;
  },
): Promise<{ jobId: string } | { error: string }> {
  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .insert({
      user_id: args.userId,
      provider: args.provider,
      job_type: args.jobType,
      status: "queued",
      payload: args.payload ?? {},
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { error: error?.message ?? "enqueue failed" };
  }
  return { jobId: data.id as string };
}

export async function updateIntegrationAccountSyncFields(
  supabase: SupabaseClient,
  args: {
    userId: string;
    provider: IntegrationProviderId;
    syncStatus: "idle" | "queued" | "running" | "succeeded" | "failed";
    lastSyncAt?: string | null;
    importStatsPatch?: Record<string, unknown>;
  },
): Promise<{ error: string | null }> {
  const { data: row } = await supabase
    .from("integration_accounts")
    .select("id, import_stats")
    .eq("user_id", args.userId)
    .eq("provider", args.provider)
    .maybeSingle();

  if (!row?.id) {
    return { error: "integration row missing" };
  }

  const prevStats =
    row.import_stats && typeof row.import_stats === "object" && !Array.isArray(row.import_stats)
      ? (row.import_stats as Record<string, unknown>)
      : {};

  const import_stats = args.importStatsPatch ? { ...prevStats, ...args.importStatsPatch } : prevStats;

  const { error } = await supabase
    .from("integration_accounts")
    .update({
      sync_status: args.syncStatus,
      last_sync_at: args.lastSyncAt ?? undefined,
      import_stats,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("user_id", args.userId);

  return { error: error?.message ?? null };
}
