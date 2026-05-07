"use server";

import { revalidatePath } from "next/cache";

import { clearGithubImportPatForUser, upsertGithubImportPatForUser } from "@/lib/integrations/github/github-import-pat-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVAL = ["/integrations", "/dashboard"] as const;

export async function saveGithubImportPatAction(
  pat: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const res = await upsertGithubImportPatForUser(user.id, pat);
  if (!res.ok) return res;
  for (const p of REVAL) revalidatePath(p);
  return { ok: true };
}

export async function clearGithubImportPatAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const res = await clearGithubImportPatForUser(user.id);
  if (!res.ok) return res;
  for (const p of REVAL) revalidatePath(p);
  return { ok: true };
}
