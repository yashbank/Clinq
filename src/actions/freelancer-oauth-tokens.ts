"use server";

import { z } from "zod";

import { upsertFreelancerTokensForUser } from "@/lib/integrations/freelancer/token-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const tokenPayload = z.object({
  access_token: z.string().min(1, "Missing access token"),
  refresh_token: z.string().optional(),
  expires_in: z.number().finite().positive().optional(),
});

/**
 * Server action entry point for persisting Freelancer tokens with the service role.
 * Only succeeds for the currently authenticated user (user id must match session).
 */
export async function persistFreelancerTokensForSessionUserAction(
  raw: z.infer<typeof tokenPayload>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = tokenPayload.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload" };
  }

  return upsertFreelancerTokensForUser(user.id, parsed.data);
}
