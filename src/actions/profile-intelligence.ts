"use server";

import { revalidatePath } from "next/cache";

import { runProfileIntelligencePipeline } from "@/lib/profile/intelligence/engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function refreshProfileIntelligenceAction(
  opts?: { useOpenAi?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await runProfileIntelligencePipeline(supabase, user.id, { useOpenAi: opts?.useOpenAi !== false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Intelligence refresh failed";
    return { ok: false, error: message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/proposals");
  revalidatePath("/leads");
  return { ok: true };
}
