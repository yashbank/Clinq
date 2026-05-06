"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { validateFreelancerPersonalAccessToken } from "@/lib/integrations/freelancer/api";
import { completeFreelancerConnection } from "@/lib/integrations/freelancer/complete-freelancer-connection";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

const tokenSchema = z.string().trim().min(8, "Token looks too short").max(8192, "Token is too long");

export async function validateFreelancerPersonalTokenAction(
  rawToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = tokenSchema.safeParse(rawToken);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid token";
    return { ok: false, error: msg };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const v = await validateFreelancerPersonalAccessToken(parsed.data);
  if (!v.ok) {
    return { ok: false, error: v.error };
  }
  return { ok: true };
}

export async function connectFreelancerPersonalTokenAction(
  rawToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = tokenSchema.safeParse(rawToken);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid token";
    return { ok: false, error: msg };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!hasSupabaseServiceRoleKey()) {
    return { ok: false, error: "Server is missing SUPABASE_SERVICE_ROLE_KEY (required to store tokens outside the browser)." };
  }

  const v = await validateFreelancerPersonalAccessToken(parsed.data);
  if (!v.ok) {
    return { ok: false, error: v.error };
  }

  const conn = await completeFreelancerConnection(
    user.id,
    { access_token: parsed.data, refresh_token: undefined, expires_in: undefined },
    { connectionKind: "personal_token" },
  );
  if (!conn.ok) {
    return { ok: false, error: conn.error };
  }

  revalidatePath("/integrations");
  return { ok: true };
}
