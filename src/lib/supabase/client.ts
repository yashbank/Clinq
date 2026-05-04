import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/utils/env-public";

/**
 * Supabase client for Client Components and browser-only code.
 * Uses the public anon key (RLS still applies).
 */
export function createSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();
  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
