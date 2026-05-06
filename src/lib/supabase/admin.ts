import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertServiceRoleSupabaseKey } from "@/lib/supabase/service-role-key-guard";
import { getSupabasePublicEnv } from "@/utils/env-public";
import { getSupabaseServiceRoleKey } from "@/utils/env-server";

/**
 * Privileged Supabase client (bypasses RLS). Use only in trusted server code
 * for admin tasks — never import from client components or edge middleware.
 */
export function createSupabaseAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  assertServiceRoleSupabaseKey(serviceRoleKey, NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
