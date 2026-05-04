import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { Session, User } from "@supabase/supabase-js";

/**
 * Prefer this on the server for authorization checks — validates the JWT with Supabase.
 */
export async function getServerUser(): Promise<{ user: User | null; error: Error | null }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { user: null, error };
  }
  return { user: data.user, error: null };
}

/**
 * Reads the current session from storage. Do not rely on this alone for secure
 * authorization on the server — use `getServerUser()` when you need proof of identity.
 */
export async function getServerSession(): Promise<{ session: Session | null; error: Error | null }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { session: null, error };
  }
  return { session: data.session, error: null };
}
