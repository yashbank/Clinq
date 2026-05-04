import type { SupabaseClient } from "@supabase/supabase-js";

import type { IntegrationProviderId } from "@/types/integrations";

import { getIntegrationProviderAdapter } from "@/lib/integrations/providers";
import { enqueueIntegrationSyncJob, updateIntegrationAccountSyncFields } from "@/lib/integrations/sync-queue";

/**
 * Records a sync job and finalizes it in-process.
 * Replace with a durable worker (Inngest, QStash, Supabase Edge cron) when OAuth + APIs ship.
 */
export async function recordStubSyncForManualConnect(
  supabase: SupabaseClient,
  userId: string,
  provider: IntegrationProviderId,
): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
  if (provider === "freelancer") {
    return { ok: false, error: "Freelancer uses OAuth and the real import pipeline — manual stub sync is disabled." };
  }
  const adapter = getIntegrationProviderAdapter(provider);
  const plan = adapter.buildIngestionPlan();

  const syncField = await updateIntegrationAccountSyncFields(supabase, {
    userId,
    provider,
    syncStatus: "queued",
  });
  if (syncField.error) {
    return { ok: false, error: syncField.error };
  }

  const enq = await enqueueIntegrationSyncJob(supabase, {
    userId,
    provider,
    jobType: "full_sync",
    payload: {
      adapter: adapter.describe(),
      ingestionPlan: plan,
      stub: true,
    },
  });
  if ("error" in enq) {
    await updateIntegrationAccountSyncFields(supabase, {
      userId,
      provider,
      syncStatus: "failed",
      importStatsPatch: { lastError: enq.error },
    });
    return { ok: false, error: enq.error };
  }

  const now = new Date().toISOString();

  await supabase
    .from("integration_sync_jobs")
    .update({
      status: "running",
      started_at: now,
    })
    .eq("id", enq.jobId)
    .eq("user_id", userId);

  const result = {
    message:
      "Sync job completed without provider I/O: OAuth and marketplace APIs are not enabled in this build. Job is stored for future workers.",
    planSteps: plan.steps.length,
    capabilities: adapter.capabilities,
  };

  await supabase
    .from("integration_sync_jobs")
    .update({
      status: "succeeded",
      completed_at: new Date().toISOString(),
      result,
    })
    .eq("id", enq.jobId)
    .eq("user_id", userId);

  await updateIntegrationAccountSyncFields(supabase, {
    userId,
    provider,
    syncStatus: "idle",
    lastSyncAt: new Date().toISOString(),
    importStatsPatch: {
      lastJobId: enq.jobId,
      leadsImported: 0,
      jobsSeen: 0,
      lastError: null,
    },
  });

  return { ok: true, jobId: enq.jobId };
}
