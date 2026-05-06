"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deleteFreelancerTokensForUser } from "@/lib/integrations/freelancer/token-store";
import { recordStubSyncForManualConnect } from "@/lib/integrations/sync-orchestrator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";
import type { IntegrationProviderId, IntegrationStatus } from "@/types/integrations";

const providerSchema = z.enum(["freelancer", "upwork", "fiverr", "contra"]);

const defaultCredentials = () => ({
  version: 1 as const,
  storage: "none" as const,
  externalAccountId: null as string | null,
});

export async function setIntegrationStatusAction(
  provider: IntegrationProviderId,
  status: IntegrationStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = providerSchema.safeParse(provider);
  if (!p.success) {
    return { ok: false, error: "Invalid provider" };
  }
  if (status !== "connected" && status !== "disconnected") {
    return { ok: false, error: "Invalid status" };
  }

  if (p.data === "freelancer" && status === "connected") {
    return {
      ok: false,
      error: "Freelancer connects through OAuth. Use “Connect with Freelancer” on the Freelancer card.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const now = new Date().toISOString();
  const meta =
    status === "connected"
      ? {
          reserved_at: now,
          connection_kind: "manual_slot",
          note: "OAuth is not enabled. This row reserves the integration until provider modules ship.",
        }
      : {
          disconnected_at: now,
          connection_kind: "disconnected",
          ...(p.data === "freelancer" ? { oauth_revoked_at: now } : {}),
        };

  const credentials = status === "connected" ? defaultCredentials() : defaultCredentials();

  const { data: existing, error: selErr } = await supabase
    .from("integration_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", p.data)
    .maybeSingle();

  if (selErr) {
    return { ok: false, error: selErr.message };
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("integration_accounts")
      .update({
        status,
        meta,
        credentials,
        sync_status: status === "connected" ? "idle" : "idle",
        updated_at: now,
      })
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("integration_accounts").insert({
      user_id: user.id,
      provider: p.data,
      status,
      meta,
      credentials,
      sync_status: "idle",
    });
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  if (p.data === "freelancer" && status === "disconnected") {
    if (hasSupabaseServiceRoleKey()) {
      const del = await deleteFreelancerTokensForUser(user.id);
      if (!del.ok) {
        console.warn("[integrations] deleteFreelancerTokensForUser:", del.error);
      }
    }
  }

  if (status === "connected") {
    const stub = await recordStubSyncForManualConnect(supabase, user.id, p.data);
    if (!stub.ok) {
      return { ok: false, error: stub.error };
    }
  }

  revalidatePath("/integrations");
  return { ok: true };
}
