import { z } from "zod";

const supabasePublicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "anon key looks too short"),
});

export type SupabasePublicEnv = z.infer<typeof supabasePublicSchema>;

let cached: SupabasePublicEnv | null = null;

/**
 * Supabase URL + anon key (safe to use in the browser via NEXT_PUBLIC_*).
 * Throws with a clear message if vars are missing or invalid.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  if (cached) {
    return cached;
  }
  const parsed = supabasePublicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(
      `Missing or invalid Supabase public environment variables (${msg}). Add them to .env.local (see .env.example).`,
    );
  }
  cached = parsed.data;
  return cached;
}
