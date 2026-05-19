import { parseSupabasePublicEnv, type SupabasePublicEnv } from "@/utils/supabase-env";

export type { SupabasePublicEnv };

let cached: SupabasePublicEnv | null = null;

/**
 * Supabase URL + anon key (safe to use in the browser via NEXT_PUBLIC_*).
 * Throws with a clear message if vars are missing or invalid.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  if (cached) {
    return cached;
  }
  const parsed = parseSupabasePublicEnv();
  if (!parsed.ok) {
    throw new Error(
      `Missing or invalid Supabase public environment variables (${parsed.issues.join("; ")}). Add them to .env.local (see .env.example).`,
    );
  }
  cached = parsed.env;
  return cached;
}
