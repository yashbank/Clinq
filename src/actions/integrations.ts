"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { IntegrationProviderId, IntegrationStatus } from "@/types/integrations";

const providerSchema = z.enum(["freelancer", "upwork", "fiverr", "contra"]);

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
          simulated_link: true,
          connected_at: now,
          note: "No scraping or automation is active. This row reserves the integration for future modules.",
        }
      : { disconnected_at: now };

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
      .update({ status, meta, updated_at: now })
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
    });
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/integrations");
  return { ok: true };
}
